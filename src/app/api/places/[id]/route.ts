import { NextResponse, type NextRequest } from "next/server";
import { getPlace } from "@/lib/data/places";
import type { PlacePreview } from "@/lib/data/types";

/** What the preview panel shows. Public listing data, so the CDN can hold it. */
export async function GET(_request: NextRequest, props: RouteContext<"/api/places/[id]">) {
  const { id } = await props.params;
  const place = await getPlace(id);
  if (!place) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const preview: PlacePreview & { tips?: never } = { ...place, tips: undefined };
  return NextResponse.json(preview, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
