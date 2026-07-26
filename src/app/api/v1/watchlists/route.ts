import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Manages saved wallets and tokens for the signed-in user. Uses the existing
// SavedWallet/SavedToken models — no schema changes needed.
//
// GET    /api/v1/watchlist                 — list the user's saved wallets + tokens
// POST   /api/v1/watchlist                 — add a wallet or token
// DELETE /api/v1/watchlist?id=...&kind=...  — remove a saved item

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const [wallets, tokens] = await Promise.all([
    prisma.savedWallet.findMany({ where: { userId: session.user.id } }),
    prisma.savedToken.findMany({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ wallets, tokens });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const kind = body?.kind; // "wallet" | "token"
  const address = body?.address?.trim();
  const chain = body?.chain?.trim() || "ethereum";
  const label = body?.label?.trim() || null;

  if (!kind || !address || !["wallet", "token"].includes(kind)) {
    return NextResponse.json(
      { error: "Required: kind ('wallet' or 'token'), address" },
      { status: 400 }
    );
  }

  try {
    if (kind === "wallet") {
      const saved = await prisma.savedWallet.upsert({
        where: { userId_address: { userId: session.user.id, address } },
        update: { label: label ?? undefined },
        create: { userId: session.user.id, address, label },
      });
      return NextResponse.json({ saved });
    } else {
      const saved = await prisma.savedToken.upsert({
        where: {
          userId_address_chain: { userId: session.user.id, address, chain },
        },
        update: { label: label ?? undefined },
        create: { userId: session.user.id, address, chain, label },
      });
      return NextResponse.json({ saved });
    }
  } catch (err) {
    console.error("Failed to save watchlist item:", err);
    return NextResponse.json({ error: "Failed to save item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const kind = searchParams.get("kind");

  if (!id || !kind || !["wallet", "token"].includes(kind)) {
    return NextResponse.json(
      { error: "Required query params: id, kind ('wallet' or 'token')" },
      { status: 400 }
    );
  }

  try {
    if (kind === "wallet") {
      await prisma.savedWallet.deleteMany({
        where: { id, userId: session.user.id },
      });
    } else {
      await prisma.savedToken.deleteMany({
        where: { id, userId: session.user.id },
      });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete watchlist item:", err);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
