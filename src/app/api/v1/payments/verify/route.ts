import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isHex, parseEther, formatEther } from "viem";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicClient } from "@/lib/eth";

// Keep well under serverless function duration limits (e.g. Vercel Hobby's
// 10s default) — the client polls this endpoint instead of one long wait.
export const maxDuration = 10;

const schema = z.object({
  txHash: z.string().refine((v) => isHex(v) && v.length === 66, "Invalid transaction hash"),
});

const TOLERANCE = 0.02; // allow 2% under the sticker price (gas estimation drift, rounding)

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const paymentWallet = process.env.PAYMENT_WALLET_ETH;
  if (!paymentWallet) {
    return NextResponse.json({ error: "Crypto payments are not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const txHash = parsed.data.txHash as `0x${string}`;

  const existing = await prisma.payment.findUnique({ where: { txHash } });
  if (existing) {
    return NextResponse.json({ error: "This transaction has already been used" }, { status: 409 });
  }

  let receipt;
  try {
    receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 8_000 });
  } catch {
    return NextResponse.json(
      { error: "Transaction not confirmed yet. Please wait and try again." },
      { status: 202 }
    );
  }

  const tx = await publicClient.getTransaction({ hash: txHash });

  if (receipt.status !== "success") {
    return NextResponse.json({ error: "Transaction failed on-chain" }, { status: 400 });
  }

  if (tx.to?.toLowerCase() !== paymentWallet.toLowerCase()) {
    return NextResponse.json({ error: "Transaction was not sent to the Archive44 payment wallet" }, { status: 400 });
  }

  const requiredEth = process.env.NEXT_PUBLIC_PRO_PLAN_ETH || "0.02";
  const requiredWei = parseEther(requiredEth);
  const minWei = (requiredWei * BigInt(Math.round((1 - TOLERANCE) * 1000))) / BigInt(1000);

  if (tx.value < minWei) {
    return NextResponse.json(
      { error: `Transaction value too low. Expected at least ~${requiredEth} ETH.` },
      { status: 400 }
    );
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        userId: session.user.id,
        amount: Number(formatEther(tx.value)),
        token: "ETH",
        txHash,
        status: "CONFIRMED",
        fromAddress: tx.from,
        toAddress: tx.to,
        blockNumber: Number(receipt.blockNumber),
        confirmedAt: now,
      },
    }),
    prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan: "PRO",
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId: session.user.id,
        plan: "PRO",
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    }),
  ]);

  return NextResponse.json({ payment, plan: "PRO" });
}
