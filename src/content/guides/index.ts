import type { ComponentType } from "react";
import type { MDXProps } from "mdx/types";
import type { GuideMeta } from "@/lib/domain/guides";

/**
 * Editorial guides, one for every city. Metadata lives here so it is
 * type-checked; the body is the MDX file with the same slug. Stops must match
 * the `<Stop>` elements in the body (tests/unit/guides.test.ts checks).
 */
export const GUIDES: readonly GuideMeta[] = [
  {
    slug: "rainy-sunday-waterloo",
    title: "A rainy Sunday in Waterloo",
    summary:
      "Lunch, a free ceramics gallery, and a library afternoon in Uptown Waterloo, all close together and mostly indoors.",
    city: "waterloo",
    budget: 15,
    season: "any",
    publishedAt: "2026-10-30",
    updatedAt: "2026-11-06",
    stops: [
      "vincenzos",
      "canadian-clay-and-glass-gallery",
      "waterloo-public-library",
      "waterloo-park",
    ],
  },
  {
    slug: "free-saturday-newmarket",
    title: "A free Saturday in downtown Newmarket",
    summary:
      "The market in season, the Town square, a free local history museum, and Fairy Lake, all on foot.",
    city: "newmarket",
    budget: 0,
    season: "any",
    publishedAt: "2026-10-30",
    updatedAt: "2026-11-06",
    stops: [
      "newmarket-farmers-market",
      "riverwalk-commons",
      "elman-w-campbell-museum",
      "newmarket-public-library",
      "fairy-lake-park",
    ],
  },
  {
    slug: "summer-evenings-richmond-hill",
    title: "Free summer evenings in Richmond Hill",
    summary:
      "The Town's free concerts and outdoor movies, and long evenings at Mill Pond and Lake Wilcox.",
    city: "richmond-hill",
    budget: 0,
    season: "summer",
    publishedAt: "2026-10-30",
    updatedAt: "2026-11-06",
    stops: ["concerts-in-the-park", "moonlight-movies", "mill-pond-park", "lake-wilcox-park"],
  },
  {
    slug: "kleinburg-woodbridge-vaughan",
    title: "Woodbridge, Kortright, and Kleinburg under $20",
    summary: "A farmers' market, conservation trails, and a walk through Kleinburg village.",
    city: "vaughan",
    budget: 20,
    season: "summer",
    publishedAt: "2026-10-30",
    updatedAt: "2026-11-06",
    stops: ["woodbridge-farmers-market", "kortright-centre-for-conservation", "kleinburg-village"],
  },
  {
    slug: "oakville-waterfront-on-foot",
    title: "Oakville's waterfront on foot",
    summary:
      "A museum by donation, the lakefront trail, a public gallery, and a park on Lake Ontario.",
    city: "oakville",
    budget: 0,
    season: "any",
    publishedAt: "2026-10-30",
    updatedAt: "2026-11-06",
    stops: [
      "oakville-museum",
      "oakville-waterfront-trail",
      "oakville-galleries",
      "coronation-park",
    ],
  },
  {
    slug: "unionville-day-markham",
    title: "A day on Main Street Unionville",
    summary:
      "A historic street, a free public gallery, a pond to sit by, and a Sunday market in season.",
    city: "markham",
    budget: 25,
    season: "any",
    publishedAt: "2026-10-30",
    updatedAt: "2026-11-06",
    stops: [
      "unionville-main-street",
      "varley-art-gallery-of-markham",
      "toogood-pond-park",
      "unionville-stiver-mill-farmers-market",
    ],
  },
  {
    slug: "lake-day-burlington",
    title: "A free day on Burlington's lakefront",
    summary: "The waterfront trail, a public gallery, public art downtown, and trails to the west.",
    city: "burlington",
    budget: 0,
    season: "any",
    publishedAt: "2026-11-06",
    updatedAt: "2026-11-06",
    stops: [
      "burlington-waterfront-trail",
      "art-gallery-of-burlington",
      "burlington-public-art-collection",
      "royal-botanical-gardens-hiking-trails",
    ],
  },
  {
    slug: "saturday-downtown-kitchener",
    title: "A Saturday in downtown Kitchener",
    summary:
      "The outdoor farmers' market, the region's public gallery, the central library, and Victoria Park.",
    city: "kitchener",
    budget: 15,
    season: "any",
    publishedAt: "2026-11-06",
    updatedAt: "2026-11-06",
    stops: [
      "kitchener-market",
      "kw-art-gallery-kwag",
      "kitchener-public-library-central-branch",
      "victoria-park",
    ],
  },
  {
    slug: "afternoon-galt-cambridge",
    title: "An afternoon in old Galt, Cambridge",
    summary: "A market, free galleries by the Grand River, an arts centre, and a big park.",
    city: "cambridge",
    budget: 15,
    season: "any",
    publishedAt: "2026-11-06",
    updatedAt: "2026-11-06",
    stops: [
      "cambridge-farmers-market",
      "cambridge-art-galleries",
      "cambridge-centre-for-the-arts",
      "riverside-park",
    ],
  },
  {
    slug: "free-saturday-toronto",
    title: "A free Saturday in downtown Toronto",
    summary:
      "St. Lawrence Market, Allan Gardens, the Reference Library, and Kensington, with nothing you have to buy.",
    city: "toronto",
    budget: 0,
    season: "any",
    publishedAt: "2026-11-06",
    updatedAt: "2026-11-06",
    stops: [
      "st-lawrence-market",
      "allan-gardens-conservatory",
      "toronto-reference-library",
      "kensington-market",
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
