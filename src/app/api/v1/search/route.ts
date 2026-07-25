import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getWalletProfile } from "@/lib/wallet";
import { getTokenProfile } from "@/lib/token";

const prisma = new PrismaClient();

// How long a cached entity is considered fresh before re-fetching from Moralis.
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const type = searchParams.get("type"); // "wallet" | "token"
  const chain = searchParams.get("chain") ?? "ethereum";

  if (!address || !type) {
    return NextResponse.json(
      { error: "Missing required params: address, type" },
      { status: 400 }
    );
  }

  if (type === "wallet") {
    return handleWallet(address);
  } else if (type === "token") {
    return handleToken(address, chain);
  }

  return NextResponse.json({ error: "type must be wallet or token" }, { status: 400 });
}

async function handleWallet(address: string) {
  const existing = await prisma.wallet.findUnique({ where: { address } });

  if (existing && Date.now() - existing.updatedAt.getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ source: "cache", data: existing });
  }

  try {
    const profile = await getWalletProfile(address, "ethereum");

    const wallet = await prisma.wallet.upsert({
      where: { address },
      update: {
        balanceEth: parseFloat(profile.nativeBalance) || 0,
        txCount: profile.recentTransactions.length,
        lastActive: profile.recentTransactions[0]
          ? new Date(profile.recentTransactions[0].timestamp)
          : undefined,
        metadata: profile as any,
      },
      create: {
        address,
        balanceEth: parseFloat(profile.nativeBalance) || 0,
        txCount: profile.recentTransactions.length,
        firstSeen: new Date(),
        lastActive: profile.recentTransactions[0]
          ? new Date(profile.recentTransactions[0].timestamp)
          : undefined,
        metadata: profile as any,
      },
    });

    return NextResponse.json({ source: "live", data: wallet });
  } catch (err) {
    console.error("Moralis wallet lookup failed:", err);
    return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 502 });
  }
}

async function handleToken(address: string, chain: string) {
  const existing = await prisma.token.findUnique({
    where: { address_chain: { address, chain } },
  });

  if (existing && Date.now() - existing.updatedAt.getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ source: "cache", data: existing });
  }

  try {
    const profile = await getTokenProfile(address, chain as any);

    const token = await prisma.token.upsert({
      where: { address_chain: { address, chain } },
      update: {
        symbol: profile.symbol,
        name: profile.name,
        decimals: profile.decimals,
        priceUsd: profile.priceUsd ?? undefined,
        metadata: profile as any,
      },
      create: {
        address,
        chain,
        symbol: profile.symbol,
        name: profile.name,
        decimals: profile.decimals,
        priceUsd: profile.priceUsd ?? undefined,
        metadata: profile as any,
      },
    });

    return NextResponse.json({ source: "live", data: token });
  } catch (err) {
    console.error("Moralis token lookup failed:", err);
    return NextResponse.json({ error: "Failed to fetch token data" }, { status: 502 });
  }
}
