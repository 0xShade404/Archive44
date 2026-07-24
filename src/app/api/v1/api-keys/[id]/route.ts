import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ isActive: z.boolean() });

async function loadOwnedKey(userId: string, id: string) {
  return prisma.apiKey.findFirst({ where: { id, userId } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await loadOwnedKey(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const apiKey = await prisma.apiKey.update({
    where: { id },
    data: { isActive: parsed.data.isActive },
    select: { id: true, name: true, createdAt: true, isActive: true, lastUsed: true, requests: true },
  });

  return NextResponse.json({ apiKey });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await loadOwnedKey(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  await prisma.apiKey.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
