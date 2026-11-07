/**
 * Category metadata. The database `categories` table is seeded from this list;
 * accent colours are design tokens: small indicators anywhere, and the wash, rules,
 * and blocks that give a category's own page its look.
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
  "volunteer",
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
    name: "Get moving",
    shortName: "Active",
    accent: "#046963",
    description: "Trails, pools, drop-in sports, and outdoor fitness.",
  },
  {
    slug: "mental",
    name: "Calm and support",
    shortName: "Calm",
    accent: "#594E97",
    description: "Libraries, gardens, quiet spaces, and support when you need it.",
  },
  {
    slug: "social",
    name: "Meet people",
    shortName: "Meet people",
    accent: "#275B99",
    description: "Community hubs, clubs, and places to make friends.",
  },
  {
    slug: "financial",
    name: "Money help",
    shortName: "Money",
    accent: "#5D6002",
    description: "Free tax clinics, money tools, and help with costs.",
  },
  {
    slug: "arts",
    name: "Arts and crafts",
    shortName: "Arts",
    accent: "#754384",
    description: "Galleries, studios, pottery, and making things.",
  },
  {
    slug: "dance-music",
    name: "Music and dance",
    shortName: "Music",
    accent: "#8F3B4A",
    description: "Studios, choirs, jams, and live performance.",
  },
  {
    slug: "food",
    name: "Food and markets",
    shortName: "Food",
    accent: "#8E4120",
    description: "Markets, multicultural kitchens, and food festivals.",
  },
  {
    slug: "cafes",
    name: "Cafes and hangouts",
    shortName: "Cafes",
    accent: "#804E00",
    description: "Coffee shops, reading nooks, and places to linger.",
  },
  {
    slug: "thrifting",
    name: "Thrift and vintage",
    shortName: "Thrift",
    accent: "#00657E",
    description: "Thrift stores, vintage, records, and swaps.",
  },
  {
    slug: "volunteer",
    name: "Volunteer",
    shortName: "Volunteer",
    accent: "#336A26",
    description: "Food banks, care homes, and community groups that need a hand.",
  },
  {
    slug: "events",
    name: "Festivals",
    shortName: "Festivals",
    accent: "#863D6A",
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

/** Dataset slugs mapped to the current ones. Older city files use the long forms. */
export const LEGACY_CATEGORY_MAP: Record<string, CategorySlug> = {
  physical: "physical",
  mental: "mental",
  social: "social",
  financial: "financial",
  arts: "arts",
  "arts-crafts": "arts",
  "dance-music": "dance-music",
  food: "food",
  "food-culture": "food",
  cafes: "cafes",
  "cafes-spaces": "cafes",
  thrifting: "thrifting",
  volunteer: "volunteer",
  events: "events",
};
