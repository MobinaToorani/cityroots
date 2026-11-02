/**
 * Category metadata. The database `categories` table is seeded from this list;
 * accent colours are design tokens and only ever used as small indicators.
 */
export const CATEGORY_SLUGS = [
  "physical",
  "mental",
  "social",
  "financial",
  "arts",
  "dance-music",
  "food",
  "cafes",
  "thrifting",
  "events",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export type CategoryMeta = {
  slug: CategorySlug;
  name: string;
  shortName: string;
  accent: string;
  description: string;
};

export const CATEGORIES: readonly CategoryMeta[] = [
  {
    slug: "physical",
    name: "Move your body",
    shortName: "Physical",
    accent: "#0E7A5F",
    description: "Trails, pools, drop-in sports, and outdoor fitness.",
  },
  {
    slug: "mental",
    name: "Mental and emotional",
    shortName: "Mental",
    accent: "#5E56A8",
    description: "Libraries, quiet spaces, support groups, and mindfulness.",
  },
  {
    slug: "social",
    name: "Meet people",
    shortName: "Social",
    accent: "#1D6FA5",
    description: "Community hubs, clubs, and places to make friends.",
  },
  {
    slug: "financial",
    name: "Money skills",
    shortName: "Financial",
    accent: "#B07414",
    description: "Free workshops, tax clinics, and money tools.",
  },
  {
    slug: "arts",
    name: "Arts and crafts",
    shortName: "Arts",
    accent: "#7C4FB8",
    description: "Galleries, studios, pottery, and making things.",
  },
  {
    slug: "dance-music",
    name: "Dance and music",
    shortName: "Dance and music",
    accent: "#C2453F",
    description: "Studios, choirs, jams, and live performance.",
  },
  {
    slug: "food",
    name: "Food and culture",
    shortName: "Food",
    accent: "#C25E1E",
    description: "Markets, multicultural kitchens, and food festivals.",
  },
  {
    slug: "cafes",
    name: "Cafes and third spaces",
    shortName: "Cafes",
    accent: "#6B5F4E",
    description: "Coffee shops, reading nooks, and places to linger.",
  },
  {
    slug: "thrifting",
    name: "Thrifting and markets",
    shortName: "Thrifting",
    accent: "#0E7A8A",
    description: "Thrift stores, vintage, swaps, and pop-ups.",
  },
  {
    slug: "events",
    name: "Events and festivals",
    shortName: "Events",
    accent: "#B03E76",
    description: "Seasonal festivals, free concerts, and community events.",
  },
];

const bySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function isCategorySlug(value: string): value is CategorySlug {
  return bySlug.has(value as CategorySlug);
}

export function categoryMeta(slug: CategorySlug): CategoryMeta {
  const meta = bySlug.get(slug);
  if (!meta) throw new Error(`Unknown category: ${slug}`);
  return meta;
}

/** Legacy dataset slugs mapped to the current ones. */
export const LEGACY_CATEGORY_MAP: Record<string, CategorySlug> = {
  physical: "physical",
  mental: "mental",
  social: "social",
  financial: "financial",
  "arts-crafts": "arts",
  "dance-music": "dance-music",
  "food-culture": "food",
  "cafes-spaces": "cafes",
  thrifting: "thrifting",
  events: "events",
};
