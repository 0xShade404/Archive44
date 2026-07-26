import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSearchSummary } from "@/lib/gemini";

// Founder profile management. Unlike wallets/tokens, there's no automated
// data source for founder info (Moralis only covers on-chain data) — this
// is curated content, created/edited manually via this admin-only endpoint.
//
// GET  /api/v1/founders?slug=...   — fetch one founder (public, no auth needed)
// POST /api/v1/founders            — create or update a founder profile (ADMIN only)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    const founders = await prisma.founder.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ founders });
  }

  const founder = await prisma.founder.findUnique({ where: { slug } });
  if (!founder) {
    return NextResponse.json({ error: "Founder not found" }, { status: 404 });
  }
  return NextResponse.json({ founder });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  // Restricted to admins since this is curated, publicly-displayed content —
  // anyone with an account shouldn't be able to write arbitrary founder bios.
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const slug = body?.slug?.trim();
  const name = body?.name?.trim();
  const bio = body?.bio?.trim() || null;
  const twitter = body?.twitter?.trim() || null;
  const linkedin = body?.linkedin?.trim() || null;
  const image = body?.image?.trim() || null;

  if (!slug || !name) {
    return NextResponse.json({ error: "Required: slug, name" }, { status: 400 });
  }

  // Generate an AI summary from whatever bio/links were provided, same
  // pattern used for wallet/token summaries elsewhere in the app.
  const aiSummary = await generateSearchSummary(name, [
    {
      type: "founder",
      title: name,
      subtitle: "Founder",
      summary: bio || "No bio provided.",
      risk: "Low",
    },
  ]).catch(() => null);

  try {
    const founder = await prisma.founder.upsert({
      where: { slug },
      update: {
        name,
        bio: bio ?? undefined,
        twitter: twitter ?? undefined,
        linkedin: linkedin ?? undefined,
        image: image ?? undefined,
        aiSummary: aiSummary ?? undefined,
      },
      create: {
        slug,
        name,
        bio,
        twitter,
        linkedin,
        image,
        aiSummary: aiSummary ?? undefined,
      },
    });
    return NextResponse.json({ founder });
  } catch (err) {
    console.error("Failed to save founder profile:", err);
    return NextResponse.json({ error: "Failed to save founder profile" }, { status: 500 });
  }
}
