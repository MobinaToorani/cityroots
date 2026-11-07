import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories, cities, places } from "@/lib/db/schema";
import type { CategorySlug } from "@/lib/domain/categories";
import { DataError } from "@/lib/errors";
import { notFinished } from "./listing-filters";
import type { CategoryCount, CityDetail, CitySummary, SiteStats } from "./types";

const published = sql`${places.status} = 'published' and ${notFinished}`;

const placeCount = sql<number>`count(${places.id}) filter (where ${published})::int`;
const freeCount = sql<number>`count(${places.id}) filter (where ${published} and ${places.costBand} = 'free')::int`;

const browsable = sql`${published} and ${places.kind} <> 'event'`;
const browseCount = sql<number>`count(${places.id}) filter (where ${browsable})::int`;
const browseFreeCount = sql<number>`count(${places.id}) filter (where ${browsable} and ${places.costBand} = 'free')::int`;

/**
 * A category's count is what its link opens: Explore leaves dated events out of a
 * category, except Festivals, which is made of them.
 */
const inCategoryList = sql`${published} and (${places.kind} <> 'event' or ${categories.slug} = 'events')`;
const categoryCount = sql<number>`count(${places.id}) filter (where ${inCategoryList})::int`;
const categoryFreeCount = sql<number>`count(${places.id}) filter (where ${inCategoryList} and ${places.costBand} = 'free')::int`;

const summaryColumns = {
  id: cities.id,
  slug: cities.slug,
  name: cities.name,
  region: cities.region,
  tagline: cities.tagline,
  heroImage: cities.heroImage,
  placeCount,
  freeCount,
  browseCount,
  browseFreeCount,
};

export async function listLiveCities(): Promise<CitySummary[]> {
  try {
    return await db()
      .select(summaryColumns)
      .from(cities)
      .leftJoin(places, eq(places.cityId, cities.id))
      .where(eq(cities.status, "live"))
      .groupBy(cities.id)
      .orderBy(asc(cities.name));
  } catch (cause) {
    throw new DataError("Could not load cities", { cause });
  }
}

export async function getCityBySlug(slug: string): Promise<CityDetail | null> {
  try {
    const rows = await db()
      .select({
        ...summaryColumns,
        province: cities.province,
        description: cities.description,
        curatorNote: cities.curatorNote,
        lat: cities.lat,
        lng: cities.lng,
      })
      .from(cities)
      .leftJoin(places, eq(places.cityId, cities.id))
      .where(and(eq(cities.slug, slug), eq(cities.status, "live")))
      .groupBy(cities.id);
    return rows[0] ?? null;
  } catch (cause) {
    throw new DataError(`Could not load city ${slug}`, { cause });
  }
}

export async function getCategoryCounts(cityId?: string): Promise<CategoryCount[]> {
  try {
    const joinOn = cityId
      ? and(eq(places.categoryId, categories.id), eq(places.cityId, cityId))
      : eq(places.categoryId, categories.id);
    const rows = await db()
      .select({ slug: categories.slug, count: categoryCount, freeCount: categoryFreeCount })
      .from(categories)
      .leftJoin(places, joinOn)
      .groupBy(categories.id)
      .orderBy(asc(categories.position));
    return rows.map((r) => ({ ...r, slug: r.slug as CategorySlug }));
  } catch (cause) {
    throw new DataError("Could not load category counts", { cause });
  }
}

export async function getSiteStats(): Promise<SiteStats> {
  try {
    const [row] = await db()
      .select({
        cities: sql<number>`count(distinct ${places.cityId})::int`,
        places: sql<number>`count(*)::int`,
        free: sql<number>`count(*) filter (where ${places.costBand} = 'free')::int`,
      })
      .from(places)
      .innerJoin(cities, eq(cities.id, places.cityId))
      .where(and(published, eq(cities.status, "live")));
    if (!row || row.places === 0) return { cities: 0, places: 0, freeShare: 0 };
    return {
      cities: row.cities,
      places: row.places,
      freeShare: Math.round((row.free / row.places) * 100),
    };
  } catch (cause) {
    throw new DataError("Could not load site stats", { cause });
  }
}
