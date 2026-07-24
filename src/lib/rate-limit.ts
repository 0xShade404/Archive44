import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiter backed by the database, so it stays correct
 * across concurrent serverless instances (an in-memory counter only limits
 * requests that land on the same instance). Not perfectly atomic under very
 * high concurrency on the same key, but that's an acceptable tradeoff for
 * abuse mitigation rather than a hard security boundary.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; remaining: number }> {
  const now = new Date();
  const bucket = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (!bucket || bucket.resetAt < now) {
    const resetAt = new Date(now.getTime() + windowMs);
    await prisma.rateLimitBucket.upsert({
      where: { key },
      update: { count: 1, resetAt },
      create: { key, count: 1, resetAt },
    });
    return { ok: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  await prisma.rateLimitBucket.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return { ok: true, remaining: limit - bucket.count - 1 };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
