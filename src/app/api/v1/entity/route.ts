import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getWalletProfile } from "@/lib/wallet";
import { getTokenProfile } from "@/lib/token";

// Live Moralis-backed entity lookups — separate from /api/v1/search, which
// is the original AI-powered search over the Archive44 database. This route
// exists to pull fresh on-chain data (wallet balances, token metadata) and
// cache it into the Wallet/Token tables that /api/v1/search reads from.
//
// Usage: /api/v1/entity?address=0x...&type=wallet
//        /api/v1/entity?address=0x...&type=token&chain=base

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

// Converts any JSON-serializable object into a Prisma-safe InputJsonValue,
// avoiding `any` while still accepting our loosely-typed Moralis profile shape.
function toJsonValue(data: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

async function handleWallet(address: string) {
  const existing = await prisma.wallet.findUnique({ where: { address } });

  if (existing && Date.now() - existing.updatedAt.getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ source: "cache", data: existing });
  }

  try {
    const profile = await getWalletProfile(address, "ethereum");
    const latestTx = profile.recentTransactions[0];

    const wallet = await prisma.wallet.upsert({
      where: { address },
      update: {
        balanceEth: parseFloat(profile.nativeBalance) || 0,
        txCount: profile.recentTransactions.length,
        lastActive: latestTx ? new Date(latestTx.timestamp) : undefined,
        metadata: toJsonValue(profile),
      },
      create: {
        address,
        balanceEth: parseFloat(profile.nativeBalance) || 0,
        txCount: profile.recentTransactions.length,
        firstSeen: new Date(),
        lastActive: latestTx ? new Date(latestTx.timestamp) : undefined,
        metadata: toJsonValue(profile),
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
    const profile = await getTokenProfile(address, chain as "ethereum" | "base" | "polygon" | "bsc" | "arbitrum");

    const token = await prisma.token.upsert({
      where: { address_chain: { address, chain } },
      update: {
        symbol: profile.symbol,
        name: profile.name,
        decimals: profile.decimals,
        priceUsd: profile.priceUsd ?? undefined,
        metadata: toJsonValue(profile),
      },
      create: {
        address,
        chain,
        symbol: profile.symbol,
        name: profile.name,
        decimals: profile.decimals,
        priceUsd: profile.priceUsd ?? undefined,
        metadata: toJsonValue(profile),
      },
    });

    return NextResponse.json({ source: "live", data: token });
  } catch (err) {
    console.error("Moralis token lookup failed:", err);
    return NextResponse.json({ error: "Failed to fetch token data" }, { status: 502 });
  }
}
