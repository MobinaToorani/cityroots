import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories, cities, places } from "@/lib/db/schema";
import { CATEGORIES, type CategorySlug } from "@/lib/domain/categories";
import { compareCostBands, type CostBand } from "@/lib/domain/cost";
import { fuzzyScore } from "@/lib/domain/fuzzy";
import { DataError } from "@/lib/errors";
import { notFinished } from "./listing-filters";

export type SearchHit =
  | { kind: "city"; slug: string; name: string; detail: string }
  | { kind: "category"; slug: CategorySlug; name: string; detail: string }
  | {
      kind: "place";
      id: string;
      name: string;
      detail: string;
      category: CategorySlug;
      costBand: CostBand;
    };

export type SearchResults = { cities: SearchHit[]; categories: SearchHit[]; places: SearchHit[] };

const LIMITS = { cities: 3, categories: 3, places: 8 };

/**
 * Palette search across cities, categories, and places. At about 400 rows the
 * whole index is scored in TypeScript; move to pg_trgm past a few thousand.
 */
export async function searchEverything(query: string): Promise<SearchResults> {
  try {
    const [cityRows, placeRows] = await Promise.all([
      db()
        .select({ slug: cities.slug, name: cities.name, region: cities.region })
        .from(cities)
        .where(eq(cities.status, "live")),
      db()
        .select({
          id: places.id,
          name: places.name,
          neighborhood: places.neighborhood,
          tags: places.tags,
          costBand: places.costBand,
          category: categories.slug,
          cityName: cities.name,
        })
        .from(places)
        .innerJoin(cities, eq(cities.id, places.cityId))
        .innerJoin(categories, eq(categories.id, places.categoryId))
        .where(and(eq(places.status, "published"), eq(cities.status, "live"), notFinished)),
    ]);

    const top = <T>(
      items: { item: T; score: number | null }[],
      limit: number,
      tie?: (a: T, b: T) => number,
    ) =>
      items
        .filter((x): x is { item: T; score: number } => x.score !== null)
        .sort((a, b) => b.score - a.score || (tie ? tie(a.item, b.item) : 0))
        .slice(0, limit)
        .map((x) => x.item);

    return {
      cities: top(
        cityRows.map((c) => ({
          item: {
            kind: "city" as const,
            slug: c.slug,
            name: c.name,
            detail: c.region ?? "City guide",
          },
          score: fuzzyScore(query, c.name),
        })),
        LIMITS.cities,
      ),
      categories: top(
        CATEGORIES.map((c) => ({
          item: { kind: "category" as const, slug: c.slug, name: c.name, detail: "Category" },
          score: fuzzyScore(query, `${c.name} ${c.shortName}`),
        })),
        LIMITS.categories,
      ),
      // Name matches count double; free first on ties.
      places: top(
        placeRows.map((p) => {
          const byName = fuzzyScore(query, p.name);
          const byOther = fuzzyScore(
            query,
            `${p.name} ${p.neighborhood ?? ""} ${p.cityName} ${(p.tags ?? []).join(" ")}`,
          );
          return {
            item: {
              kind: "place" as const,
              id: p.id,
              name: p.name,
              detail: [p.neighborhood, p.cityName].filter(Boolean).join(", "),
              category: p.category as CategorySlug,
              costBand: p.costBand,
            },
            score: byName !== null ? byName * 2 : byOther,
          };
        }),
        LIMITS.places,
        (a, b) => compareCostBands(a.costBand, b.costBand),
      ),
    };
  } catch (cause) {
    throw new DataError("Search failed", { cause });
  }
}
