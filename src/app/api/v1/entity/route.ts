import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getWalletProfile, buildWalletTimeline } from "@/lib/wallet";
import { extractRelatedWallets } from "@/lib/related";
import { getTokenProfile } from "@/lib/token";
import { getTokenHolderStats } from "@/lib/holders";
import { getSolanaTokenProfile, getSolanaWalletProfile } from "@/lib/solana";
import { computeWalletRiskScore } from "@/lib/risk";
import { generateSearchSummary } from "@/lib/gemini";

// Live Moralis-backed entity lookups — separate from /api/v1/search, which
// is the original AI-powered search over the Archive44 database. This route
// exists to pull fresh on-chain data (wallet balances, token metadata) and
// cache it into the Wallet/Token tables that the wallet/token profile pages
// and /api/v1/search read from.
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
    return handleWallet(address, chain);
  } else if (type === "token") {
    return handleToken(address, chain);
  }

  return NextResponse.json({ error: "type must be wallet or token" }, { status: 400 });
}

function toJsonValue(data: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

async function handleWallet(address: string, chain: string) {
  if (chain === "solana") {
    return handleSolanaWallet(address);
  }

  const existing = await prisma.wallet.findUnique({ where: { address } });

  if (existing && Date.now() - existing.updatedAt.getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ source: "cache", data: existing });
  }

  try {
    const profile = await getWalletProfile(address, "ethereum");
    const latestTx = profile.recentTransactions[0];
    const oldestTx = profile.recentTransactions[profile.recentTransactions.length - 1];

    const riskScore = computeWalletRiskScore({
      oldestKnownTxTimestamp: oldestTx ? oldestTx.timestamp : null,
      txCount: profile.recentTransactions.length,
      nativeBalanceEth: parseFloat(profile.nativeBalance) || 0,
      counterpartyAddresses: extractRelatedWallets(profile, address),
    });

    const timeline = buildWalletTimeline(profile, address);
    const relatedWallets = extractRelatedWallets(profile, address);

    const aiSummary = await generateSearchSummary(address, [
      {
        type: "wallet",
        title: address,
        subtitle: "Wallet",
        summary: `Balance: ${profile.nativeBalance} ETH. ${profile.recentTransactions.length} recent transactions. Risk score: ${riskScore}/100.`,
        risk: riskScore < 34 ? "Low" : riskScore < 67 ? "Medium" : "High",
      },
    ]).catch(() => null);

    const wallet = await prisma.wallet.upsert({
      where: { address },
      update: {
        balanceEth: parseFloat(profile.nativeBalance) || 0,
        txCount: profile.recentTransactions.length,
        lastActive: latestTx ? new Date(latestTx.timestamp) : undefined,
        riskScore,
        aiSummary: aiSummary ?? undefined,
        metadata: toJsonValue({ ...profile, timeline, relatedWallets }),
      },
      create: {
        address,
        balanceEth: parseFloat(profile.nativeBalance) || 0,
        txCount: profile.recentTransactions.length,
        firstSeen: new Date(),
        lastActive: latestTx ? new Date(latestTx.timestamp) : undefined,
        riskScore,
        aiSummary: aiSummary ?? undefined,
        metadata: toJsonValue({ ...profile, timeline, relatedWallets }),
      },
    });

    return NextResponse.json({ source: "live", data: wallet });
  } catch (err) {
    console.error("Moralis wallet lookup failed:", err);
    return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 502 });
  }
}

async function handleSolanaWallet(address: string) {
  const existing = await prisma.wallet.findUnique({ where: { address } });

  if (existing && Date.now() - existing.updatedAt.getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ source: "cache", data: existing });
  }

  try {
    const profile = await getSolanaWalletProfile(address);
    const nativeBalance = parseFloat(profile.nativeBalanceSol) || 0;

    // Solana wallets share the same Wallet table as EVM wallets (no chain
    // column exists), so we tag them "solana" to distinguish them. No
    // timeline data is available for Solana — Moralis doesn't offer general
    // tx history for it — so metadata.timeline stays empty here.
    const existingTags = existing?.tags ?? [];
    const tags = existingTags.includes("solana") ? existingTags : [...existingTags, "solana"];

    const wallet = await prisma.wallet.upsert({
      where: { address },
      update: {
        balanceEth: nativeBalance,
        txCount: 0,
        tags,
        metadata: toJsonValue(profile),
      },
      create: {
        address,
        balanceEth: nativeBalance,
        txCount: 0,
        firstSeen: new Date(),
        tags,
        metadata: toJsonValue(profile),
      },
    });

    return NextResponse.json({ source: "live", data: wallet });
  } catch (err) {
    console.error("Moralis Solana wallet lookup failed:", err);
    return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 502 });
  }
}

async function handleToken(address: string, chain: string) {
  if (chain === "solana") {
    return handleSolanaToken(address);
  }

  const existing = await prisma.token.findUnique({
    where: { address_chain: { address, chain } },
  });

  if (existing && Date.now() - existing.updatedAt.getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ source: "cache", data: existing });
  }

  try {
    const profile = await getTokenProfile(address, chain as "ethereum" | "base" | "polygon" | "bsc" | "arbitrum");
    const holderStats = await getTokenHolderStats(address, chain as "ethereum" | "base" | "polygon" | "bsc" | "arbitrum").catch(
      () => null
    );

    const token = await prisma.token.upsert({
      where: { address_chain: { address, chain } },
      update: {
        symbol: profile.symbol,
        name: profile.name,
        decimals: profile.decimals,
        priceUsd: profile.priceUsd ?? undefined,
        totalSupply: profile.totalSupplyFormatted ?? undefined,
        marketCap: profile.marketCapUsd ?? undefined,
        holders: holderStats?.totalHolders ?? undefined,
        metadata: toJsonValue({ ...profile, holderStats }),
      },
      create: {
        address,
        chain,
        symbol: profile.symbol,
        name: profile.name,
        decimals: profile.decimals,
        priceUsd: profile.priceUsd ?? undefined,
        totalSupply: profile.totalSupplyFormatted ?? undefined,
        marketCap: profile.marketCapUsd ?? undefined,
        holders: holderStats?.totalHolders ?? undefined,
        metadata: toJsonValue({ ...profile, holderStats }),
      },
    });

    return NextResponse.json({ source: "live", data: token });
  } catch (err) {
    console.error("Moralis token lookup failed:", err);
    return NextResponse.json({ error: "Failed to fetch token data" }, { status: 502 });
  }
}

async function handleSolanaToken(address: string) {
  const existing = await prisma.token.findUnique({
    where: { address_chain: { address, chain: "solana" } },
  });

  if (existing && Date.now() - existing.updatedAt.getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ source: "cache", data: existing });
  }

  try {
    const profile = await getSolanaTokenProfile(address);

    const token = await prisma.token.upsert({
      where: { address_chain: { address, chain: "solana" } },
      update: {
        symbol: profile.symbol,
        name: profile.name,
        decimals: profile.decimals,
        priceUsd: profile.priceUsd ?? undefined,
        metadata: toJsonValue(profile),
      },
      create: {
        address,
        chain: "solana",
        symbol: profile.symbol,
        name: profile.name,
        decimals: profile.decimals,
        priceUsd: profile.priceUsd ?? undefined,
        metadata: toJsonValue(profile),
      },
    });

    return NextResponse.json({ source: "live", data: token });
  } catch (err) {
    console.error("Moralis Solana token lookup failed:", err);
    return NextResponse.json({ error: "Failed to fetch token data" }, { status: 502 });
  }
}
