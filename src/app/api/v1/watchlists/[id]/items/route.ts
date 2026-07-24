import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({
  type: z.enum(["wallet", "token", "protocol", "founder"]),
  target: z.string().min(1),
});

type WatchlistItem = z.infer<typeof itemSchema>;

async function loadOwnedWatchlist(userId: string, id: string) {
  return prisma.watchlist.findFirst({ where: { id, userId } });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const watchlist = await loadOwnedWatchlist(session.user.id, id);
  if (!watchlist) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const items = (watchlist.items as unknown as WatchlistItem[]) ?? [];
  const exists = items.some((i) => i.type === parsed.data.type && i.target === parsed.data.target);
  const nextItems = exists ? items : [...items, parsed.data];

  const updated = await prisma.watchlist.update({
    where: { id },
    data: { items: nextItems as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json({ watchlist: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const watchlist = await loadOwnedWatchlist(session.user.id, id);
  if (!watchlist) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const items = (watchlist.items as unknown as WatchlistItem[]) ?? [];
  const nextItems = items.filter(
    (i) => !(i.type === parsed.data.type && i.target === parsed.data.target)
  );

  const updated = await prisma.watchlist.update({
    where: { id },
    data: { items: nextItems as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json({ watchlist: updated });
}
