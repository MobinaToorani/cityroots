import type { ComponentType } from "react";
import type { MDXProps } from "mdx/types";
import type { GuideMeta } from "@/lib/domain/guides";

/**
 * Editorial guides, one per major city at launch. Metadata lives here so it is
 * type-checked; the body is the MDX file with the same slug. Stops must match
 * the `<Stop>` elements in the body (tests/unit/guides.test.ts checks).
 */
export const GUIDES: readonly GuideMeta[] = [
  {
    slug: "rainy-sunday-waterloo",
    title: "A rainy Sunday in Waterloo under $15",
    summary:
      "Coffee, ceramics, and a library afternoon in Uptown Waterloo, all indoors and all within a few blocks of King Street.",
    city: "waterloo",
    budget: 15,
    season: "any",
    publishedAt: "2026-10-30",
    updatedAt: "2026-10-30",
    stops: [
      "smile-tiger-coffee",
      "canadian-clay-and-glass-gallery",
      "vincenzos",
      "waterloo-public-library",
      "waterloo-park",
    ],
  },
  {
    slug: "free-saturday-newmarket",
    title: "A free Saturday in downtown Newmarket",
    summary:
      "The farmers' market, Main Street murals, a river path, and Fairy Lake, all on foot and without spending a dollar.",
    city: "newmarket",
    budget: 0,
    season: "summer",
    publishedAt: "2026-10-30",
    updatedAt: "2026-10-30",
    stops: [
      "newmarket-farmers-market",
      "main-street-historic-district",
      "main-street-mural-trail",
      "riverwalk-commons-river-path",
      "newmarket-public-library",
      "fairy-lake-park",
    ],
  },
  {
    slug: "summer-evenings-richmond-hill",
    title: "Free summer evenings in Richmond Hill",
    summary:
      "Thursday concerts at Mill Pond, Friday films at Richmond Green, and long evenings at Lake Wilcox, with no tickets needed.",
    city: "richmond-hill",
    budget: 0,
    season: "summer",
    publishedAt: "2026-10-30",
    updatedAt: "2026-10-30",
    stops: [
      "concerts-in-the-park",
      "mill-pond-park",
      "movies-under-the-stars",
      "lake-wilcox-park",
      "free-tennis-courts-richmond-hill-parks",
      "open-mic-night-local-venues",
    ],
  },
  {
    slug: "unionville-day-markham",
    title: "A day in Unionville, then milk tea in Milliken",
    summary:
      "Markham's heritage main street, a free Group of Seven gallery, and a Hong Kong style lunch, for under $25.",
    city: "markham",
    budget: 25,
    season: "summer",
    publishedAt: "2026-10-30",
    updatedAt: "2026-10-30",
    stops: [
      "unionville-farmers-market",
      "unionville-main-street",
      "toogood-pond-park",
      "varley-art-gallery-of-markham",
      "unionville-mural-and-public-art-walk",
      "hong-kong-style-cafe-row",
    ],
  },
  {
    slug: "oakville-waterfront-on-foot",
    title: "Oakville's waterfront on foot",
    summary:
      "A free walk along Lake Ontario from downtown to Bronte Harbour, with a gallery, a ravine trail, and golden hour at the end.",
    city: "oakville",
    budget: 0,
    season: "any",
    publishedAt: "2026-10-30",
    updatedAt: "2026-10-30",
    stops: [
      "oakville-waterfront-trail",
      "oakville-galleries",
      "sixteen-mile-creek-trail",
      "kerr-village",
      "coronation-park",
      "bronte-harbour-sunrise-and-golden-hour",
    ],
  },
  {
    slug: "kleinburg-woodbridge-vaughan",
    title: "Woodbridge bakeries and Kleinburg galleries under $20",
    summary:
      "A Saturday across Vaughan's two oldest neighbourhoods: a farmers' market, Humber valley trails, espresso, and village galleries.",
    city: "vaughan",
    budget: 20,
    season: "summer",
    publishedAt: "2026-10-30",
    updatedAt: "2026-10-30",
    stops: [
      "woodbridge-farmers-market",
      "italian-bakery-row-woodbridge",
      "boyd-conservation-area",
      "kortright-centre-for-conservation",
      "kleinburg-village",
      "kleinburg-village-art-walk",
    ],
  },
];

export function getGuide(slug: string): GuideMeta | null {
  return GUIDES.find((g) => g.slug === slug) ?? null;
}

export function guidesForCity(city: string): GuideMeta[] {
  return GUIDES.filter((g) => g.city === city);
}

export async function loadGuideBody(slug: string): Promise<ComponentType<MDXProps>> {
  const mod = (await import(`./${slug}.mdx`)) as { default: ComponentType<MDXProps> };
  return mod.default;
}
