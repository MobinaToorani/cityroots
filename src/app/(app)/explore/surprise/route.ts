import { NextResponse, type NextRequest } from "next/server";
import { queryPlaces } from "@/lib/data/places";
import { loadExploreState, normalizeExploreState } from "@/lib/domain/explore-params";

/** Sends the visitor to one random place that matches the current filters. */
export async function GET(request: NextRequest) {
  const state = normalizeExploreState(await loadExploreState(request.nextUrl.searchParams));
  const { items } = await queryPlaces(
    { ...state, page: Number.POSITIVE_INFINITY },
    { hideEvents: true },
  );
  const pick = items[Math.floor(Math.random() * items.length)];
  const target = new URL(pick ? `/places/${pick.id}` : "/explore", request.nextUrl);
  return NextResponse.redirect(target, { headers: { "Cache-Control": "no-store" } });
}
