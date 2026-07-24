import { NextResponse } from "next/server";

export async function GET() {
  const wallet = process.env.PAYMENT_WALLET_ETH;
  const usdtContract = process.env.USDT_CONTRACT;
  const amountEth = process.env.NEXT_PUBLIC_PRO_PLAN_ETH || "0.02";
  const amountUsdt = process.env.NEXT_PUBLIC_PRO_PLAN_USDT || "49";

  if (!wallet) {
    return NextResponse.json(
      { error: "Crypto payments are not configured yet. Set PAYMENT_WALLET_ETH." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    wallet,
    amountEth,
    usdtContract: usdtContract ?? null,
    amountUsdt,
  });
}
