import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  address: z.string().min(1),
  chain: z.string().default("ethereum"),
  label: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const saved = await prisma.savedToken.upsert({
    where: {
      userId_address_chain: {
        userId: session.user.id,
        address: parsed.data.address,
        chain: parsed.data.chain,
      },
    },
    update: { label: parsed.data.label },
    create: {
      userId: session.user.id,
      address: parsed.data.address,
      chain: parsed.data.chain,
      label: parsed.data.label,
    },
  });

  return NextResponse.json({ saved }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const tokens = await prisma.savedToken.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tokens });
}
