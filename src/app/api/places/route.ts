import { NextResponse, type NextRequest } from "next/server";
import { getPlaceCards } from "@/lib/data/places";

/** Cards for the ids a browser has saved. Public listing data only. */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean);
  return NextResponse.json({ places: await getPlaceCards(ids.slice(0, 200)) });
}
