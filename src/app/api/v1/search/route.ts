import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { hashApiKey } from "@/lib/api-key";
import { generateSearchSummary } from "@/lib/gemini";
import { getWalletProfile, buildWalletTimeline } from "@/lib/wallet";
import { extractRelatedWallets } from "@/lib/related";
import { getTokenProfile } from "@/lib/token";
import { getTokenHolderStats } from "@/lib/holders";
import { getSolanaTokenProfile, getSolanaWalletProfile } from "@/lib/solana";
import { computeWalletRiskScore } from "@/lib/risk";
import { Prisma } from "@prisma/client";

function riskLabel(score: number): "Low" | "Medium" | "High" {
  if (score < 34) return "Low";
  if (score < 67) return "Medium";
  return "High";
}

type SearchResult = {
  type: "wallet" | "token" | "protocol" | "founder";
  title: string;
  subtitle: string;
  summary: string;
  risk: "Low" | "Medium" | "High";
  href: string;
};

// EVM addresses: 0x + 40 hex chars.
const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
// Solana addresses: base58-encoded, no 0x prefix, typically 32-44 chars.
// Base58 excludes 0, O, I, l to avoid visual ambiguity.
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// EVM chains to try in order when a contract address doesn't specify which
// chain it's on — same address can exist as different tokens across chains,
// so we check the most commonly-used ones first.
const EVM_CHAINS_TO_TRY: Array<"ethereum" | "base" | "polygon" | "bsc" | "arbitrum"> = [
  "ethereum",
  "base",
  "polygon",
  "bsc",
  "arbitrum",
];

function toJsonValue(data: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

async function authenticateRequest(request: NextRequest): Promise<{ userId: string | null; apiKeyId: string | null } | null> {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const key = authHeader.slice(7).trim();
    const apiKey = await prisma.apiKey.findUnique({ where: { key: hashApiKey(key) } });
    if (!apiKey || !apiKey.isActive) return null;
    return { userId: apiKey.userId, apiKeyId: apiKey.id };
  }

  const session = await auth();
  if (session?.user) return { userId: session.user.id, apiKeyId: null };

  return { userId: null, apiKeyId: null };
}

// Tries a token address against each supported EVM chain in turn, returning
// the first one that resolves to a real token (not just an "Unknown Token"
// placeholder, which means the contract doesn't exist as an ERC-20 on that
// particular chain).
async function tryEvmTokenAcrossChains(
  address: string
): Promise<{ chain: string; profile: Awaited<ReturnType<typeof getTokenProfile>> } | null> {
  for (const chain of EVM_CHAINS_TO_TRY) {
    try {
      const profile = await getTokenProfile(address, chain);
      if (profile.name !== "Unknown Token" || profile.symbol !== "?") {
        return { chain, profile };
      }
    } catch {
      // Not a token on this chain — try the next one.
    }
  }
  return null;
}

async function tryLiveLookup(address: string): Promise<SearchResult | null> {
  // Solana addresses are structurally distinct from EVM ones — check first.
  if (SOLANA_ADDRESS_REGEX.test(address) && !EVM_ADDRESS_REGEX.test(address)) {
    try {
      const solProfile = await getSolanaTokenProfile(address);
      if (solProfile.name !== "Unknown Token" || solProfile.symbol !== "?") {
        const token = await prisma.token.upsert({
          where: { address_chain: { address, chain: "solana" } },
          update: {
            symbol: solProfile.symbol,
            name: solProfile.name,
            decimals: solProfile.decimals,
            priceUsd: solProfile.priceUsd ?? undefined,
            metadata: toJsonValue(solProfile),
          },
          create: {
            address,
            chain: "solana",
            symbol: solProfile.symbol,
            name: solProfile.name,
            decimals: solProfile.decimals,
            priceUsd: solProfile.priceUsd ?? undefined,
            metadata: toJsonValue(solProfile),
          },
        });

        return {
          type: "token",
          title: token.symbol,
          subtitle: `${token.name} (Solana)`,
          summary: `Live data from Moralis. Price: ${token.priceUsd ? `$${token.priceUsd}` : "unavailable"}.`,
          risk: riskLabel(token.riskScore),
          href: `/token/${token.address}`,
        };
      }
    } catch {
      // Not a resolvable Solana token — fall through to wallet check below.
    }

    // Not a token — try it as a Solana wallet instead.
    try {
      const existing = await prisma.wallet.findUnique({ where: { address } });
      const solWallet = await getSolanaWalletProfile(address);
      const nativeBalance = parseFloat(solWallet.nativeBalanceSol) || 0;
      const existingTags = existing?.tags ?? [];
      const tags = existingTags.includes("solana") ? existingTags : [...existingTags, "solana"];

      const wallet = await prisma.wallet.upsert({
        where: { address },
        update: { balanceEth: nativeBalance, tags, metadata: toJsonValue(solWallet) },
        create: {
          address,
          balanceEth: nativeBalance,
          txCount: 0,
          firstSeen: new Date(),
          tags,
          metadata: toJsonValue(solWallet),
        },
      });

      return {
        type: "wallet",
        title: wallet.address,
        subtitle: "Solana Wallet",
        summary: `Live data from Moralis. Balance: ${wallet.balanceEth} SOL.`,
        risk: riskLabel(wallet.riskScore),
        href: `/wallet/${wallet.address}`,
      };
    } catch {
      return null;
    }
  }

  if (!EVM_ADDRESS_REGEX.test(address)) return null;

  // Try as an EVM token across supported chains first.
  const evmToken = await tryEvmTokenAcrossChains(address);
  if (evmToken) {
    const { chain, profile: tokenProfile } = evmToken;
    const holderStats = await getTokenHolderStats(
      address,
      chain as "ethereum" | "base" | "polygon" | "bsc" | "arbitrum"
    ).catch(() => null);

    const token = await prisma.token.upsert({
      where: { address_chain: { address, chain } },
      update: {
        symbol: tokenProfile.symbol,
        name: tokenProfile.name,
        decimals: tokenProfile.decimals,
        priceUsd: tokenProfile.priceUsd ?? undefined,
        totalSupply: tokenProfile.totalSupplyFormatted ?? undefined,
        marketCap: tokenProfile.marketCapUsd ?? undefined,
        holders: holderStats?.totalHolders ?? undefined,
        metadata: toJsonValue({ ...tokenProfile, holderStats }),
      },
      create: {
        address,
        chain,
        symbol: tokenProfile.symbol,
        name: tokenProfile.name,
        decimals: tokenProfile.decimals,
        priceUsd: tokenProfile.priceUsd ?? undefined,
        totalSupply: tokenProfile.totalSupplyFormatted ?? undefined,
        marketCap: tokenProfile.marketCapUsd ?? undefined,
        holders: holderStats?.totalHolders ?? undefined,
        metadata: toJsonValue({ ...tokenProfile, holderStats }),
      },
    });

    return {
      type: "token",
      title: token.symbol,
      subtitle: `${token.name} (${chain})`,
      summary: `Live data from Moralis. Price: ${token.priceUsd ? `$${token.priceUsd}` : "unavailable"}.${token.holders ? ` ${token.holders.toLocaleString()} holders.` : ""}`,
      risk: riskLabel(token.riskScore),
      href: `/token/${token.address}`,
    };
  }

  // Not a token on any supported chain — try it as an Ethereum wallet.
  try {
    const walletProfile = await getWalletProfile(address, "ethereum");
    const oldestTx = walletProfile.recentTransactions[walletProfile.recentTransactions.length - 1];

    const riskScore = computeWalletRiskScore({
      oldestKnownTxTimestamp: oldestTx ? oldestTx.timestamp : null,
      txCount: walletProfile.recentTransactions.length,
      nativeBalanceEth: parseFloat(walletProfile.nativeBalance) || 0,
      counterpartyAddresses: extractRelatedWallets(walletProfile, address),
    });

    const timeline = buildWalletTimeline(walletProfile, address);
    const relatedWallets = extractRelatedWallets(walletProfile, address);

    const wallet = await prisma.wallet.upsert({
      where: { address },
      update: {
        balanceEth: parseFloat(walletProfile.nativeBalance) || 0,
        txCount: walletProfile.recentTransactions.length,
        riskScore,
        metadata: toJsonValue({ ...walletProfile, timeline, relatedWallets }),
      },
      create: {
        address,
        balanceEth: parseFloat(walletProfile.nativeBalance) || 0,
        txCount: walletProfile.recentTransactions.length,
        firstSeen: new Date(),
        riskScore,
        metadata: toJsonValue({ ...walletProfile, timeline, relatedWallets }),
      },
    });

    return {
      type: "wallet",
      title: wallet.address,
      subtitle: wallet.ens || wallet.label || "Wallet",
      summary: `Live data from Moralis. Balance: ${wallet.balanceEth} ETH across ${wallet.txCount} recent transactions.`,
      risk: riskLabel(wallet.riskScore),
      href: `/wallet/${wallet.address}`,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const authResult = await authenticateRequest(request);
  if (authResult === null) {
    return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 401 });
  }

  if (!authResult.apiKeyId && !authResult.userId) {
    const ip = getClientIp(request);
    const { ok } = await rateLimit(`search:${ip}`, 10, 60_000);
    if (!ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Sign in or use an API key for higher limits." },
        { status: 429 }
      );
    }
  }

  const startedAt = Date.now();

  const [wallets, tokens, protocols, founders] = await Promise.all([
    prisma.wallet.findMany({
      where: {
        OR: [
          { address: { equals: q, mode: "insensitive" } },
          { ens: { contains: q, mode: "insensitive" } },
          { label: { contains: q, mode: "insensitive" } },
          { tags: { has: q.toLowerCase() } },
        ],
      },
      take: 5,
    }),
    prisma.token.findMany({
      where: {
        OR: [
          { address: { equals: q, mode: "insensitive" } },
          { symbol: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
    prisma.protocol.findMany({
      where: {
        OR: [
          { slug: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
    prisma.founder.findMany({
      where: {
        OR: [
          { slug: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
  ]);

  const results: SearchResult[] = [
    ...wallets.map((w) => ({
      type: "wallet" as const,
      title: w.address,
      subtitle: w.ens || w.label || "Wallet",
      summary: w.aiSummary || "No summary available yet for this wallet.",
      risk: riskLabel(w.riskScore),
      href: `/wallet/${w.address}`,
    })),
    ...tokens.map((t) => ({
      type: "token" as const,
      title: t.symbol,
      subtitle: t.name,
      summary: t.aiSummary || "No summary available yet for this token.",
      risk: riskLabel(t.riskScore),
      href: `/token/${t.address}`,
    })),
    ...protocols.map((p) => ({
      type: "protocol" as const,
      title: p.name,
      subtitle: p.category || "Protocol",
      summary: p.aiSummary || p.description || "No summary available yet for this protocol.",
      risk: riskLabel(p.riskScore),
      href: `/protocol/${p.slug}`,
    })),
    ...founders.map((f) => ({
      type: "founder" as const,
      title: f.name,
      subtitle: "Founder",
      summary: f.aiSummary || f.bio || "No summary available yet for this founder.",
      risk: riskLabel(f.riskScore),
      href: `/founder/${f.slug}`,
    })),
  ];

  // No local matches, but the query looks like a real address — try a live
  // lookup across EVM chains and Solana instead of just returning "no results found."
  let liveResult = false;
  if (results.length === 0 && (EVM_ADDRESS_REGEX.test(q) || SOLANA_ADDRESS_REGEX.test(q))) {
    const live = await tryLiveLookup(q);
    if (live) {
      results.push(live);
      liveResult = true;
    }
  }

  const templateSummary =
    results.length > 0
      ? `Found ${results.length} result${results.length === 1 ? "" : "s"} for "${q}"${liveResult ? " (fetched live)" : " across the Archive44 knowledge base"}.`
      : `No archived entities matched "${q}" yet. Try a wallet address, token symbol, protocol, or founder name.`;

  const aiSummary = await generateSearchSummary(q, results).catch(() => null);
  const summary = aiSummary ?? templateSummary;

  await prisma.search
    .create({
      data: {
        userId: authResult.userId,
        query: q,
        results: results as unknown as object,
      },
    })
    .catch((err) => console.error("Failed to record search history", err));

  if (authResult.apiKeyId) {
    await prisma.apiKey
      .update({
        where: { id: authResult.apiKeyId },
        data: { lastUsed: new Date(), requests: { increment: 1 } },
      })
      .catch((err) => console.error("Failed to update API key usage", err));
  }

  return NextResponse.json({
    query: q,
    summary,
    results,
    meta: {
      latency_ms: Date.now() - startedAt,
      version: "1.0",
      ai_generated: aiSummary !== null,
      live_lookup: liveResult,
    },
  });
}
