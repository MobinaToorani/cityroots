import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { cities, places, submissions } from "@/lib/db/schema";
import type { Submission } from "@/lib/domain/submission";
import { DataError } from "@/lib/errors";

export type PlaceRef = { id: string; name: string; cityName: string };

export async function getPlaceRef(id: string): Promise<PlaceRef | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const [row] = await db()
      .select({ id: places.id, name: places.name, cityName: cities.name })
      .from(places)
      .innerJoin(cities, eq(cities.id, places.cityId))
      .where(and(eq(places.id, id), eq(places.status, "published")));
    return row ?? null;
  } catch (cause) {
    throw new DataError(`Could not load place ${id}`, { cause });
  }
}

export async function cityExists(slug: string): Promise<boolean> {
  const [row] = await db().select({ id: cities.id }).from(cities).where(eq(cities.slug, slug));
  return Boolean(row);
}

/** Stores a submission in the moderation queue. Nothing is published here. */
export async function createSubmission(input: Submission): Promise<{ id: string }> {
  // The honeypot is always empty here (validation rejects anything else).
  const { email, company, ...payload } = input;
  void company;
  try {
    const [row] = await db()
      .insert(submissions)
      .values({
        type: input.type,
        payload,
        placeId: input.type === "correction" ? input.placeId : null,
        contactEmail: email ?? null,
      })
      .returning({ id: submissions.id });
    if (!row) throw new Error("Insert returned no row");
    return row;
  } catch (cause) {
    throw new DataError("Could not save submission", { cause });
  }
}
