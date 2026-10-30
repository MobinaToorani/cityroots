import { NextResponse, type NextRequest } from "next/server";
import { searchEverything } from "@/lib/data/search";
import { logger } from "@/lib/logger";
import { clientFingerprint, consumeRateLimit } from "@/lib/rate-limit";

const EMPTY = { cities: [], categories: [], places: [] };

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json(EMPTY);

  const limit = await consumeRateLimit("search", await clientFingerprint());
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many searches. Wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const results = await searchEverything(q);
    return NextResponse.json(results, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    logger.error("Palette search failed", { error });
    return NextResponse.json({ error: "Search is not working right now." }, { status: 500 });
  }
}
