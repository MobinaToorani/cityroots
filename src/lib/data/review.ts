import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { db, type Database } from "@/lib/db/client";
import { categories, cities, places, submissions, type PlaceHours } from "@/lib/db/schema";
import { slugify } from "@/lib/domain/copy";
import { parseWeeklyHours } from "@/lib/domain/hours";
import type { PlaceEdit } from "@/lib/domain/review";
import { DataError } from "@/lib/errors";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type SubmissionRow = {
  id: string;
  type: "new_place" | "correction";
  status: ReviewStatus;
  payload: Record<string, unknown>;
  contactEmail: string | null;
  placeId: string | null;
  placeName: string | null;
  reviewNotes: string | null;
  createdAt: Date;
};

const UUID = /^[0-9a-f-]{36}$/i;

function wrap<T>(what: string, run: () => Promise<T>): Promise<T> {
  return run().catch((cause: unknown) => {
    throw new DataError(`Could not ${what}`, { cause });
  });
}

export function listSubmissions(status: ReviewStatus, limit = 100): Promise<SubmissionRow[]> {
  return wrap("list submissions", () =>
    db()
      .select({
        id: submissions.id,
        type: submissions.type,
        status: submissions.status,
        payload: submissions.payload,
        contactEmail: submissions.contactEmail,
        placeId: submissions.placeId,
        placeName: places.name,
        reviewNotes: submissions.reviewNotes,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .leftJoin(places, eq(places.id, submissions.placeId))
      .where(eq(submissions.status, status))
      .orderBy(status === "pending" ? submissions.createdAt : desc(submissions.updatedAt))
      .limit(limit),
  );
}

export async function getSubmission(id: string): Promise<SubmissionRow | null> {
  if (!UUID.test(id)) return null;
  const [row] = await wrap("load a submission", () =>
    db()
      .select({
        id: submissions.id,
        type: submissions.type,
        status: submissions.status,
        payload: submissions.payload,
        contactEmail: submissions.contactEmail,
        placeId: submissions.placeId,
        placeName: places.name,
        reviewNotes: submissions.reviewNotes,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .leftJoin(places, eq(places.id, submissions.placeId))
      .where(eq(submissions.id, id)),
  );
  return row ?? null;
}

export async function pendingCounts(): Promise<{ submissions: number }> {
  const [row] = await wrap("count the queue", () =>
    db().select({ n: count() }).from(submissions).where(eq(submissions.status, "pending")),
  );
  return { submissions: row?.n ?? 0 };
}

/** Everything a curator can edit on a place, as the edit form shows it. */
export type PlaceForEdit = {
  id: string;
  name: string;
  citySlug: string;
  category: string;
  kind: "place" | "event" | "program" | "resource";
  costBand: "free" | "low" | "moderate" | "varies";
  priceNote: string | null;
  summary: string;
  description: string;
  neighborhood: string | null;
  address: string | null;
  hoursText: string | null;
  sourceUrl: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  status: "published" | "pending" | "rejected";
};

export async function getPlaceForEdit(id: string): Promise<PlaceForEdit | null> {
  if (!UUID.test(id)) return null;
  const [row] = await wrap("load a place", () =>
    db()
      .select({
        id: places.id,
        name: places.name,
        citySlug: cities.slug,
        category: categories.slug,
        kind: places.kind,
        costBand: places.costBand,
        priceNote: places.priceNote,
        summary: places.summary,
        description: places.description,
        neighborhood: places.neighborhood,
        address: places.address,
        hours: places.hours,
        sourceUrl: places.sourceUrl,
        phone: places.phone,
        lat: places.lat,
        lng: places.lng,
        status: places.status,
      })
      .from(places)
      .innerJoin(cities, eq(cities.id, places.cityId))
      .innerJoin(categories, eq(categories.id, places.categoryId))
      .where(eq(places.id, id)),
  );
  if (!row) return null;
  const { hours, ...rest } = row;
  return { ...rest, hoursText: hours?.text ?? null };
}

export function hoursFromText(text: string | null): PlaceHours | null {
  if (!text) return null;
  const weekly = parseWeeklyHours(text);
  return weekly ? { text, weekly } : { text };
}

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

async function refs(tx: Tx, citySlug: string, category: string) {
  const [city] = await tx.select({ id: cities.id }).from(cities).where(eq(cities.slug, citySlug));
  const [cat] = await tx
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, category));
  if (!city || !cat) throw new Error(`Unknown city ${citySlug} or category ${category}`);
  return { cityId: city.id, categoryId: cat.id };
}

function placeValues(edit: PlaceEdit) {
  return {
    name: edit.name,
    kind: edit.kind,
    costBand: edit.costBand,
    priceNote: edit.priceNote,
    summary: edit.summary,
    description: edit.description,
    neighborhood: edit.neighborhood,
    address: edit.address,
    hours: hoursFromText(edit.hoursText),
    sourceUrl: edit.sourceUrl,
    phone: edit.phone,
    lat: edit.lat,
    lng: edit.lng,
  };
}

const today = () => new Date().toISOString().slice(0, 10);

/** Publishes a suggested place and closes its submission, in one transaction. */
export async function publishSuggestedPlace(
  submissionId: string,
  reviewerId: string,
  edit: PlaceEdit,
): Promise<{ placeId: string }> {
  return wrap("publish the place", () =>
    db().transaction(async (tx) => {
      const { cityId, categoryId } = await refs(tx, edit.citySlug, edit.category);
      const taken = new Set(
        (await tx.select({ slug: places.slug }).from(places).where(eq(places.cityId, cityId))).map(
          (r) => r.slug,
        ),
      );
      const base = slugify(edit.name) || "place";
      let slug = base;
      for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
      const [place] = await tx
        .insert(places)
        .values({
          ...placeValues(edit),
          cityId,
          categoryId,
          slug,
          status: "published",
          lastVerifiedAt: today(),
        })
        .returning({ id: places.id });
      if (!place) throw new Error("Insert returned no row");
      const closed = await tx
        .update(submissions)
        .set({ status: "approved", reviewerId, reviewNotes: edit.notes, placeId: place.id })
        .where(and(eq(submissions.id, submissionId), eq(submissions.status, "pending")))
        .returning({ id: submissions.id });
      if (closed.length === 0) throw new Error("Submission was already reviewed");
      return { placeId: place.id };
    }),
  );
}

/**
 * Closes a correction. With an edit, the place is updated in the same
 * transaction; `closePlace` takes it off the site instead.
 */
export async function resolveCorrection(input: {
  submissionId: string;
  placeId: string;
  reviewerId: string;
  edit: PlaceEdit | null;
  closePlace: boolean;
  notes: string | null;
}): Promise<void> {
  await wrap("apply the correction", () =>
    db().transaction(async (tx) => {
      if (input.closePlace) {
        await tx.update(places).set({ status: "rejected" }).where(eq(places.id, input.placeId));
      } else if (input.edit) {
        const { cityId, categoryId } = await refs(tx, input.edit.citySlug, input.edit.category);
        await tx
          .update(places)
          .set({ ...placeValues(input.edit), cityId, categoryId, lastVerifiedAt: today() })
          .where(eq(places.id, input.placeId));
      }
      const closed = await tx
        .update(submissions)
        .set({ status: "approved", reviewerId: input.reviewerId, reviewNotes: input.notes })
        .where(and(eq(submissions.id, input.submissionId), eq(submissions.status, "pending")))
        .returning({ id: submissions.id });
      if (closed.length === 0) throw new Error("Submission was already reviewed");
    }),
  );
}

export async function rejectSubmission(
  submissionId: string,
  reviewerId: string,
  notes: string | null,
): Promise<boolean> {
  const rows = await wrap("reject the submission", () =>
    db()
      .update(submissions)
      .set({ status: "rejected", reviewerId, reviewNotes: notes })
      .where(and(eq(submissions.id, submissionId), eq(submissions.status, "pending")))
      .returning({ id: submissions.id }),
  );
  return rows.length > 0;
}
