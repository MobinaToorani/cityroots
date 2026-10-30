import "server-only";
import { createHash } from "node:crypto";
import { and, eq, lt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { rateLimits } from "@/lib/db/schema";
import { slidingWindowCount, windowStart } from "@/lib/domain/rate-limit-math";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export const LIMITS = {
  submit: { limit: 5, windowSeconds: 60 * 60 },
  search: { limit: 60, windowSeconds: 60 },
} as const;

/**
 * Who is asking, without storing who they are: the client IP hashed with the
 * app secret. Falls back to a shared bucket when no IP header is present.
 */
export async function clientFingerprint(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${env().AUTH_SECRET}:${ip}`).digest("hex").slice(0, 32);
}

/** In-Postgres sliding-window rate limiter. Counts the attempt it checks. */
export async function consumeRateLimit(
  bucket: keyof typeof LIMITS,
  subject: string,
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = LIMITS[bucket];
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const start = windowStart(now, windowMs);
  const key = `${bucket}:${subject}`;
  try {
    const [row] = await db()
      .insert(rateLimits)
      .values({ key, windowStart: new Date(start), count: 1 })
      .onConflictDoUpdate({
        target: [rateLimits.key, rateLimits.windowStart],
        set: { count: sql`${rateLimits.count} + 1`, updatedAt: new Date() },
      })
      .returning({ count: rateLimits.count });
    const [prev] = await db()
      .select({ count: rateLimits.count })
      .from(rateLimits)
      .where(and(eq(rateLimits.key, key), eq(rateLimits.windowStart, new Date(start - windowMs))));

    // Occasionally clear windows nobody can hit any more.
    if (Math.random() < 0.02) {
      await db()
        .delete(rateLimits)
        .where(lt(rateLimits.windowStart, new Date(start - 2 * windowMs)));
    }

    const estimate = slidingWindowCount(row?.count ?? 1, prev?.count ?? 0, now - start, windowMs);
    if (estimate <= limit) return { allowed: true };
    return { allowed: false, retryAfterSeconds: Math.ceil((start + windowMs - now) / 1000) };
  } catch (error) {
    // Fail open: a broken limiter must not take submissions or search down.
    logger.error("Rate limiter unavailable", { error, bucket });
    return { allowed: true };
  }
}
