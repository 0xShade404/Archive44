import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Manages price/activity alerts using the existing Alert model.
//
// GET    /api/v1/alerts             — list the user's alerts
// POST   /api/v1/alerts             — create an alert
// DELETE /api/v1/alerts?id=...      — remove an alert
//
// NOTE: this only handles alert CRUD. Actually detecting when a condition
// is met and notifying the user requires a recurring background check —
// e.g. a Netlify scheduled function calling /api/v1/alerts/check on a
// timer. That's a separate piece of setup (a netlify.toml schedule entry)
// and hasn't been built yet — worth doing as the next step so alerts
// actually fire instead of just being stored.

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const alerts = await prisma.alert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ alerts });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const type = body?.type?.trim(); // e.g. "price_above", "price_below", "balance_change"
  const target = body?.target?.trim(); // wallet or token address
  const condition = body?.condition; // arbitrary JSON, e.g. { threshold: 1.5 }

  if (!type || !target || condition === undefined) {
    return NextResponse.json(
      { error: "Required: type, target, condition" },
      { status: 400 }
    );
  }

  try {
    const alert = await prisma.alert.create({
      data: {
        userId: session.user.id,
        type,
        target,
        condition,
      },
    });
    return NextResponse.json({ alert });
  } catch (err) {
    console.error("Failed to create alert:", err);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Required query param: id" }, { status: 400 });
  }

  try {
    await prisma.alert.deleteMany({ where: { id, userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete alert:", err);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
