import "server-only";
import { and, asc, eq, gte, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories, cities, events, places } from "@/lib/db/schema";
import type { CategorySlug } from "@/lib/domain/categories";
import { compareCostBands, type CostBand } from "@/lib/domain/cost";
import { DataError } from "@/lib/errors";

export type EventItem = {
  id: string;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date | null;
  precision: "day" | "month";
  costBand: CostBand;
  citySlug: string;
  cityName: string;
  placeId: string | null;
  category: CategorySlug | null;
};

type EventQuery = { city?: string | null; freeOnly?: boolean; now?: Date; limit?: number };

/** Events that have not ended yet, soonest first. */
export async function listUpcomingEvents({
  city,
  freeOnly,
  now = new Date(),
  limit,
}: EventQuery = {}): Promise<EventItem[]> {
  const conditions: SQL[] = [eq(cities.status, "live"), gte(events.endAt, now)];
  if (city) conditions.push(eq(cities.slug, city));
  if (freeOnly) conditions.push(eq(events.costBand, "free"));
  try {
    const query = db()
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        startAt: events.startAt,
        endAt: events.endAt,
        precision: events.datePrecision,
        costBand: events.costBand,
        citySlug: cities.slug,
        cityName: cities.name,
        placeId: events.placeId,
        category: categories.slug,
      })
      .from(events)
      .innerJoin(cities, eq(cities.id, events.cityId))
      .leftJoin(places, eq(places.id, events.placeId))
      .leftJoin(categories, eq(categories.id, places.categoryId))
      .where(and(...conditions))
      .orderBy(asc(events.startAt), asc(events.title));
    const rows = limit ? await query.limit(limit * 3) : await query;
    const items = rows.map((r) => ({ ...r, category: r.category as CategorySlug | null }));
    return limit ? items.slice(0, limit) : items;
  } catch (cause) {
    throw new DataError("Could not load events", { cause });
  }
}

/** For strips: free first, then the soonest. */
export async function listUpcomingFreeFirst(
  city: string,
  limit: number,
  now = new Date(),
): Promise<EventItem[]> {
  const items = await listUpcomingEvents({ city, now });
  return items
    .sort(
      (a, b) =>
        compareCostBands(a.costBand, b.costBand) || a.startAt.getTime() - b.startAt.getTime(),
    )
    .slice(0, limit);
}
