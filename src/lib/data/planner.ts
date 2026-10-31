import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, gte, inArray, isNotNull, lte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { cities, events, places, plans, type PlanStop } from "@/lib/db/schema";
import { defaultExploreState } from "@/lib/domain/explore-params";
import type { PlannerCandidate } from "@/lib/domain/planner";
import { DataError } from "@/lib/errors";
import { getPlaceCards, queryPlaces } from "./places";
import type { PlaceCard } from "./types";

/**
 * Every listing in the city that could go in a plan, in ranked order (free
 * first, then community signals), with its hours and, for events, whether a
 * known run covers the day.
 */
export async function listPlannerCandidates(
  citySlug: string,
  day: string,
): Promise<PlannerCandidate[]> {
  const { items } = await queryPlaces(
    defaultExploreState({ city: citySlug, page: Number.POSITIVE_INFINITY }),
  );
  if (items.length === 0) return [];
  try {
    const ids = items.map((i) => i.id);
    // Toronto standard time. Event runs span weeks, so daylight saving's hour does not matter.
    const dayStart = new Date(`${day}T00:00:00-05:00`);
    const dayEnd = new Date(`${day}T23:59:59-05:00`);
    const [hours, running] = await Promise.all([
      db()
        .select({ id: places.id, hours: places.hours })
        .from(places)
        .where(inArray(places.id, ids)),
      db()
        .select({ placeId: events.placeId })
        .from(events)
        .where(
          and(
            inArray(events.placeId, ids),
            isNotNull(events.placeId),
            lte(events.startAt, dayEnd),
            gte(events.endAt, dayStart),
          ),
        ),
    ]);
    const weekly = new Map(hours.map((h) => [h.id, h.hours?.weekly ?? null]));
    const inSeason = new Set(running.map((r) => r.placeId));
    return items.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      kind: p.kind,
      costBand: p.costBand,
      priceNote: p.priceNote,
      neighborhood: p.neighborhood,
      weekly: weekly.get(p.id) ?? null,
      inSeason: inSeason.has(p.id),
    }));
  } catch (cause) {
    throw new DataError("Could not load planner candidates", { cause });
  }
}

export type SavedPlan = {
  id: string;
  shareId: string;
  userId: string;
  title: string;
  day: string;
  budget: number;
  citySlug: string;
  cityName: string;
  stops: (PlanStop & { place: PlaceCard })[];
  total: number;
  createdAt: Date;
};

export type PlanSummary = Pick<SavedPlan, "shareId" | "title" | "day" | "budget" | "cityName"> & {
  stopCount: number;
};

function newShareId(): string {
  return randomBytes(8).toString("base64url");
}

export async function createPlan(input: {
  userId: string;
  cityId: string;
  title: string;
  day: string;
  budget: number;
  interests: string[];
  stops: PlanStop[];
}): Promise<{ shareId: string }> {
  try {
    const [row] = await db()
      .insert(plans)
      .values({ ...input, shareId: newShareId() })
      .returning({ shareId: plans.shareId });
    if (!row) throw new Error("Insert returned no row");
    return row;
  } catch (cause) {
    throw new DataError("Could not save the plan", { cause });
  }
}

/** Anyone with the link can open a plan. Places taken down since are left out. */
export async function getPlanByShareId(shareId: string): Promise<SavedPlan | null> {
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(shareId)) return null;
  try {
    const [row] = await db()
      .select({
        id: plans.id,
        shareId: plans.shareId,
        userId: plans.userId,
        title: plans.title,
        day: plans.day,
        budget: plans.budget,
        stops: plans.stops,
        createdAt: plans.createdAt,
        citySlug: cities.slug,
        cityName: cities.name,
      })
      .from(plans)
      .innerJoin(cities, eq(cities.id, plans.cityId))
      .where(eq(plans.shareId, shareId));
    if (!row) return null;
    const cards = new Map(
      (await getPlaceCards(row.stops.map((s) => s.placeId))).map((c) => [c.id, c]),
    );
    const stops = row.stops.flatMap((s) => {
      const place = cards.get(s.placeId);
      return place ? [{ ...s, place }] : [];
    });
    return { ...row, stops, total: stops.reduce((sum, s) => sum + s.estimate, 0) };
  } catch (cause) {
    throw new DataError("Could not load the plan", { cause });
  }
}

export async function listPlans(userId: string, limit = 20): Promise<PlanSummary[]> {
  try {
    const rows = await db()
      .select({
        shareId: plans.shareId,
        title: plans.title,
        day: plans.day,
        budget: plans.budget,
        stops: plans.stops,
        cityName: cities.name,
      })
      .from(plans)
      .innerJoin(cities, eq(cities.id, plans.cityId))
      .where(eq(plans.userId, userId))
      .orderBy(desc(plans.createdAt))
      .limit(limit);
    return rows.map(({ stops, ...r }) => ({ ...r, stopCount: stops.length }));
  } catch (cause) {
    throw new DataError("Could not list plans", { cause });
  }
}

export async function deletePlan(userId: string, shareId: string): Promise<boolean> {
  try {
    const rows = await db()
      .delete(plans)
      .where(and(eq(plans.shareId, shareId), eq(plans.userId, userId)))
      .returning({ id: plans.id });
    return rows.length > 0;
  } catch (cause) {
    throw new DataError("Could not delete the plan", { cause });
  }
}
