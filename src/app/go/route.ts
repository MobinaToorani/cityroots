import { NextResponse, type NextRequest } from "next/server";
import { exploreHref } from "@/lib/domain/explore-params";

/**
 * The home page's question ("free things in Toronto this weekend") is a plain
 * GET form, so it works without JavaScript. This turns the answer into a URL.
 */
export function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const city = q.get("city") || null;
  const free = q.get("budget") === "free";
  const when = q.get("when") ?? "anytime";

  let target: string;
  if (when === "today" || when === "weekend") {
    const params = new URLSearchParams({ when });
    if (city) params.set("city", city);
    if (free) params.set("cost", "free");
    target = `/events?${params.toString()}`;
  } else {
    target = exploreHref({ city, cost: free ? ["free"] : [], open: when === "now" });
  }
  return NextResponse.redirect(new URL(target, request.nextUrl), 303);
}
