import "server-only";
import { and, between, desc, eq, ilike, inArray, isNotNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories, cities, collectionItems, places, tips } from "@/lib/db/schema";
import type { CategorySlug } from "@/lib/domain/categories";
import { defaultExploreState, validBbox, type ExploreState } from "@/lib/domain/explore-params";
import { rank, type RankingSignals } from "@/lib/domain/ranking";
import { DataError } from "@/lib/errors";
import type { PlaceCard, PlaceDetail } from "./types";

export const PAGE_SIZE = 24;

export type MapPoint = Pick<
  PlaceCard,
  "id" | "name" | "summary" | "category" | "costBand" | "neighborhood" | "cityName" | "isPick"
> & { lat: number; lng: number };

/**
 * Every place that matches the filters and has coordinates, for the map.
 * Ignores paging and the map's own bounds, so panning never hides pins.
 */
export async function listMapPoints(state: ExploreState): Promise<MapPoint[]> {
  const { items } = await queryPlaces({ ...state, bbox: null, page: Number.POSITIVE_INFINITY });
  if (items.length === 0) return [];
  try {
    const coords = await db()
      .select({ id: places.id, lat: places.lat, lng: places.lng })
      .from(places)
      .where(
        and(
          inArray(
            places.id,
            items.map((i) => i.id),
          ),
          isNotNull(places.lat),
          isNotNull(places.lng),
        ),
      );
    const byId = new Map(coords.map((c) => [c.id, c]));
    return items.flatMap((p) => {
      const c = byId.get(p.id);
      if (!c?.lat || !c.lng) return [];
      return [
        {
          id: p.id,
          name: p.name,
          summary: p.summary,
          category: p.category,
          costBand: p.costBand,
          neighborhood: p.neighborhood,
          cityName: p.cityName,
          isPick: p.isPick,
          lat: c.lat,
          lng: c.lng,
        },
      ];
    });
  } catch (cause) {
    throw new DataError("Could not load map points", { cause });
  }
}

const cardColumns = {
  id: places.id,
  slug: places.slug,
  name: places.name,
  summary: places.summary,
  kind: places.kind,
  category: categories.slug,
  costBand: places.costBand,
  priceNote: places.priceNote,
  neighborhood: places.neighborhood,
  citySlug: cities.slug,
  cityName: cities.name,
  isPick: places.isPick,
  image: places.image,
  seasonNote: places.seasonNote,
};

const tipCount = sql<number>`(select count(*) from ${tips} where ${tips.placeId} = ${places.id} and ${tips.status} = 'published')::int`;
const saveCount = sql<number>`(select count(*) from ${collectionItems} where ${collectionItems.placeId} = ${places.id})::int`;

function toCard(row: Omit<PlaceCard, "category"> & { category: string }): PlaceCard {
  return { ...row, category: row.category as CategorySlug };
}

function visible(): SQL {
  return and(eq(places.status, "published"), eq(cities.status, "live")) as SQL;
}

export type PlaceQueryResult = { items: PlaceCard[]; total: number; hasMore: boolean };

/** The explorer query. Filtering happens in SQL; ordering uses the domain ranking. */
export async function queryPlaces(state: ExploreState): Promise<PlaceQueryResult> {
  const conditions: SQL[] = [visible()];
  if (state.city) conditions.push(eq(cities.slug, state.city));
  if (state.cat.length > 0) conditions.push(inArray(categories.slug, state.cat));
  if (state.cost.length > 0) conditions.push(inArray(places.costBand, state.cost));
  if (state.type.length > 0) conditions.push(inArray(places.kind, state.type));
  if (state.picks) conditions.push(eq(places.isPick, true));
  const bbox = validBbox(state.bbox);
  if (bbox) {
    const [w, s, e, n] = bbox;
    conditions.push(and(between(places.lng, w, e), between(places.lat, s, n)) as SQL);
  }

  let textScore: SQL<number> = sql<number>`0`;
  if (state.q) {
    const query = sql`websearch_to_tsquery('english', ${state.q})`;
    const like = `%${state.q.replace(/[%_\\]/g, "\\$&")}%`;
    const match = or(
      sql`${places.search} @@ ${query}`,
      ilike(places.name, like),
      ilike(places.neighborhood, like),
      sql`array_to_string(${places.tags}, ' ') ilike ${like}`,
    );
    if (match) conditions.push(match);
    textScore = sql<number>`(ts_rank(${places.search}, ${query}) + case when ${places.name} ilike ${like} then 0.5 else 0 end)::float`;
  }

  try {
    const rows = await db()
      .select({
        ...cardColumns,
        lastVerifiedAt: places.lastVerifiedAt,
        createdAt: places.createdAt,
        tipCount,
        saveCount,
        textScore,
      })
      .from(places)
      .innerJoin(cities, eq(cities.id, places.cityId))
      .innerJoin(categories, eq(categories.id, places.categoryId))
      .where(and(...conditions));

    const ranked = rank(
      rows.map((r) => {
        const signals: RankingSignals = {
          costBand: r.costBand,
          isPick: r.isPick,
          tipCount: r.tipCount,
          saveCount: r.saveCount,
          lastVerifiedAt: r.lastVerifiedAt ? new Date(r.lastVerifiedAt) : null,
          createdAt: r.createdAt,
          textScore: Number(r.textScore),
        };
        return { name: r.name, signals, row: r };
      }),
      state.sort,
    );
    const end = state.page * PAGE_SIZE;
    return {
      items: ranked.slice(0, end).map(({ row }) =>
        toCard({
          id: row.id,
          slug: row.slug,
          name: row.name,
          summary: row.summary,
          kind: row.kind,
          category: row.category,
          costBand: row.costBand,
          priceNote: row.priceNote,
          neighborhood: row.neighborhood,
          citySlug: row.citySlug,
          cityName: row.cityName,
          isPick: row.isPick,
          image: row.image,
          seasonNote: row.seasonNote,
        }),
      ),
      total: ranked.length,
      hasMore: ranked.length > end,
    };
  } catch (cause) {
    throw new DataError("Could not search places", { cause });
  }
}

/** Curator picks for a city, free first. */
export async function listPicks(citySlug: string, limit = 6): Promise<PlaceCard[]> {
  const result = await queryPlaces(defaultExploreState({ city: citySlug, picks: true }));
  return result.items.slice(0, limit);
}

export async function getPlace(id: string): Promise<PlaceDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const rows = await db()
      .select({
        ...cardColumns,
        description: places.description,
        highlights: places.highlights,
        tags: places.tags,
        curatorNote: places.curatorNote,
        address: places.address,
        lat: places.lat,
        lng: places.lng,
        hours: places.hours,
        phone: places.phone,
        sourceUrl: places.sourceUrl,
        accessibility: places.accessibility,
        lastVerifiedAt: places.lastVerifiedAt,
        ownerConfirmed: sql<boolean>`${places.claimedBy} is not null`,
      })
      .from(places)
      .innerJoin(cities, eq(cities.id, places.cityId))
      .innerJoin(categories, eq(categories.id, places.categoryId))
      .where(and(visible(), eq(places.id, id)));
    const row = rows[0];
    if (!row) return null;
    const placeTips = await db()
      .select({ id: tips.id, body: tips.body, createdAt: tips.createdAt })
      .from(tips)
      .where(and(eq(tips.placeId, id), eq(tips.status, "published")))
      .orderBy(desc(tips.createdAt))
      .limit(20);
    return { ...toCard(row), ...row, category: row.category as CategorySlug, tips: placeTips };
  } catch (cause) {
    throw new DataError(`Could not load place ${id}`, { cause });
  }
}

/** Same city and category, free first, excluding the place itself. */
export async function listSimilarPlaces(place: PlaceDetail, limit = 4): Promise<PlaceCard[]> {
  const result = await queryPlaces(
    defaultExploreState({ city: place.citySlug, cat: [place.category] }),
  );
  return result.items.filter((p) => p.id !== place.id).slice(0, limit);
}

/** Every published place id, for the sitemap and static params. */
export async function listPlaceIds(): Promise<{ id: string; updatedAt: Date }[]> {
  try {
    return await db()
      .select({ id: places.id, updatedAt: places.updatedAt })
      .from(places)
      .innerJoin(cities, eq(cities.id, places.cityId))
      .where(visible());
  } catch (cause) {
    throw new DataError("Could not list places", { cause });
  }
}

/** Cards for specific places, in the order given. Unpublished places are left out. */
export async function getPlaceCards(ids: readonly string[]): Promise<PlaceCard[]> {
  const valid = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (valid.length === 0) return [];
  try {
    const rows = await db()
      .select(cardColumns)
      .from(places)
      .innerJoin(cities, eq(cities.id, places.cityId))
      .innerJoin(categories, eq(categories.id, places.categoryId))
      .where(and(visible(), inArray(places.id, valid)));
    const byId = new Map(rows.map((r) => [r.id, toCard(r)]));
    return valid.flatMap((id) => byId.get(id) ?? []);
  } catch (cause) {
    throw new DataError("Could not load places", { cause });
  }
}

export type PartnerPlace = PlaceCard & {
  url: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  hours: string | null;
  website: string | null;
  updatedAt: Date;
};

/** One page of explorer results with the extra fields the partner API returns. */
export async function listPlacesForPartners(
  state: ExploreState,
  offset: number,
  limit: number,
): Promise<{ items: Omit<PartnerPlace, "url">[]; total: number }> {
  const { items, total } = await queryPlaces({ ...state, page: Number.POSITIVE_INFINITY });
  const slice = items.slice(offset, offset + limit);
  if (slice.length === 0) return { items: [], total };
  try {
    const extra = await db()
      .select({
        id: places.id,
        address: places.address,
        lat: places.lat,
        lng: places.lng,
        hours: places.hours,
        website: places.sourceUrl,
        updatedAt: places.updatedAt,
      })
      .from(places)
      .where(
        inArray(
          places.id,
          slice.map((p) => p.id),
        ),
      );
    const byId = new Map(extra.map((e) => [e.id, e]));
    return {
      total,
      items: slice.map((p) => {
        const e = byId.get(p.id);
        return {
          ...p,
          address: e?.address ?? null,
          lat: e?.lat ?? null,
          lng: e?.lng ?? null,
          hours: e?.hours?.text ?? null,
          website: e?.website ?? null,
          updatedAt: e?.updatedAt ?? new Date(0),
        };
      }),
    };
  } catch (cause) {
    throw new DataError("Could not load places for the partner API", { cause });
  }
}
