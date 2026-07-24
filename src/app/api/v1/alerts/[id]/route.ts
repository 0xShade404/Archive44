import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ isActive: z.boolean() });

async function loadOwnedAlert(userId: string, id: string) {
  return prisma.alert.findFirst({ where: { id, userId } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await loadOwnedAlert(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const alert = await prisma.alert.update({
    where: { id },
    data: { isActive: parsed.data.isActive },
  });

  return NextResponse.json({ alert });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await loadOwnedAlert(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  await prisma.alert.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
