import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { hashApiKey } from "@/lib/api-key";
import { generateSearchSummary } from "@/lib/gemini";
import { getWalletProfile } from "@/lib/wallet";
import { getTokenProfile } from "@/lib/token";
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

// Matches a standard EVM address — the only shape we can look up live via Moralis.
const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

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

// Attempts a live Moralis lookup for an address not found in the local
// database — tries token metadata first (most contract-address searches are
// for tokens), then falls back to treating it as a wallet. Caches whichever
// succeeds into the matching Prisma table so future searches hit the DB
// directly instead of calling Moralis again.
async function tryLiveLookup(address: string): Promise<SearchResult | null> {
  try {
    const tokenProfile = await getTokenProfile(address, "ethereum");
    // A contract with no resolvable name/symbol usually means it isn't
    // actually a token contract — treat that as a miss and fall through.
    if (tokenProfile.name !== "Unknown Token" || tokenProfile.symbol !== "?") {
      const token = await prisma.token.upsert({
        where: { address_chain: { address, chain: "ethereum" } },
        update: {
          symbol: tokenProfile.symbol,
          name: tokenProfile.name,
          decimals: tokenProfile.decimals,
          priceUsd: tokenProfile.priceUsd ?? undefined,
          metadata: toJsonValue(tokenProfile),
        },
        create: {
          address,
          chain: "ethereum",
          symbol: tokenProfile.symbol,
          name: tokenProfile.name,
          decimals: tokenProfile.decimals,
          priceUsd: tokenProfile.priceUsd ?? undefined,
          metadata: toJsonValue(tokenProfile),
        },
      });

      return {
        type: "token",
        title: token.symbol,
        subtitle: token.name,
        summary: `Live data from Moralis. Price: ${token.priceUsd ? `$${token.priceUsd}` : "unavailable"}.`,
        risk: riskLabel(token.riskScore),
        href: `/token/${token.address}`,
      };
    }
  } catch {
    // Not a token contract — fall through to wallet lookup below.
  }

  try {
    const walletProfile = await getWalletProfile(address, "ethereum");

    const wallet = await prisma.wallet.upsert({
      where: { address },
      update: {
        balanceEth: parseFloat(walletProfile.nativeBalance) || 0,
        txCount: walletProfile.recentTransactions.length,
        metadata: toJsonValue(walletProfile),
      },
      create: {
        address,
        balanceEth: parseFloat(walletProfile.nativeBalance) || 0,
        txCount: walletProfile.recentTransactions.length,
        firstSeen: new Date(),
        metadata: toJsonValue(walletProfile),
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
  // Moralis lookup instead of just returning "no results found."
  let liveResult = false;
  if (results.length === 0 && EVM_ADDRESS_REGEX.test(q)) {
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
