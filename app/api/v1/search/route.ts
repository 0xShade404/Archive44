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

  // 1. Check Prisma cache first — avoids burning Moralis compute units
  //    on repeat lookups of the same wallet/token.
  const cached = await prisma.entityCache.findUnique({
    where: { address_chain_type: { address, chain, type } },
  });

  if (cached && Date.now() - cached.updatedAt.getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ source: "cache", data: cached.data });
  }

  // 2. Cache miss or stale — fetch fresh data from Moralis.
  try {
    const data =
      type === "wallet"
        ? await getWalletProfile(address, chain as any)
        : await getTokenProfile(address, chain as any);

    // 3. Upsert into cache for next time.
    await prisma.entityCache.upsert({
      where: { address_chain_type: { address, chain, type } },
      update: { data: data as any, updatedAt: new Date() },
      create: { address, chain, type, data: data as any },
    });

    return NextResponse.json({ source: "live", data });
  } catch (err) {
    console.error("Moralis lookup failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch entity data" },
      { status: 502 }
    );
  }
}
