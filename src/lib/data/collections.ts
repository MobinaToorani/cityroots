import "server-only";
import { and, asc, count, desc, eq, gt, lt, max, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { collectionItems, collections, users } from "@/lib/db/schema";
import { slugify } from "@/lib/domain/copy";
import { DataError } from "@/lib/errors";
import { getPlaceCards } from "./places";
import type { PlaceCard } from "./types";

/** Hard ceiling for everyone, so one collection never becomes a dump of the whole catalogue. */
export const MAX_ITEMS_PER_COLLECTION = 200;

export type CollectionSummary = {
  id: string;
  title: string;
  isPublic: boolean;
  itemCount: number;
  updatedAt: Date;
};

export type CollectionDetail = {
  id: string;
  title: string;
  isPublic: boolean;
  userId: string;
  ownerName: string | null;
  items: { place: PlaceCard; note: string | null }[];
};

export type CollectionChoice = { id: string; title: string; hasPlace: boolean; itemCount: number };

const UUID = /^[0-9a-f-]{36}$/i;

function wrap<T>(what: string, run: () => Promise<T>): Promise<T> {
  return run().catch((cause: unknown) => {
    throw new DataError(`Could not ${what}`, { cause });
  });
}

export function listCollections(userId: string): Promise<CollectionSummary[]> {
  return wrap("list collections", () =>
    db()
      .select({
        id: collections.id,
        title: collections.title,
        isPublic: collections.isPublic,
        updatedAt: collections.updatedAt,
        itemCount: sql<number>`count(${collectionItems.placeId})::int`,
      })
      .from(collections)
      .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
      .where(eq(collections.userId, userId))
      .groupBy(collections.id)
      .orderBy(desc(collections.updatedAt)),
  );
}

export async function countCollections(userId: string): Promise<number> {
  const [row] = await wrap("count collections", () =>
    db().select({ n: count() }).from(collections).where(eq(collections.userId, userId)),
  );
  return row?.n ?? 0;
}

/** The member's collections, each marked with whether it already holds the place. */
export function collectionsForPlace(userId: string, placeId: string): Promise<CollectionChoice[]> {
  if (!UUID.test(placeId)) return Promise.resolve([]);
  return wrap("list collections for a place", () =>
    db()
      .select({
        id: collections.id,
        title: collections.title,
        itemCount: sql<number>`count(${collectionItems.placeId})::int`,
        hasPlace: sql<boolean>`coalesce(bool_or(${collectionItems.placeId} = ${placeId}), false)`,
      })
      .from(collections)
      .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
      .where(eq(collections.userId, userId))
      .groupBy(collections.id)
      .orderBy(desc(collections.updatedAt)),
  );
}

export async function createCollection(userId: string, title: string): Promise<{ id: string }> {
  return wrap("create a collection", async () => {
    const base = slugify(title) || "collection";
    const taken = new Set(
      (
        await db()
          .select({ slug: collections.slug })
          .from(collections)
          .where(eq(collections.userId, userId))
      ).map((r) => r.slug),
    );
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
    const [row] = await db()
      .insert(collections)
      .values({ userId, title, slug })
      .returning({ id: collections.id });
    if (!row) throw new Error("Insert returned no row");
    return row;
  });
}

/** Changes title or visibility. Returns false when the collection is not the member's. */
export async function updateCollection(
  userId: string,
  id: string,
  patch: { title?: string; isPublic?: boolean },
): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const rows = await wrap("update a collection", () =>
    db()
      .update(collections)
      .set(patch)
      .where(and(eq(collections.id, id), eq(collections.userId, userId)))
      .returning({ id: collections.id }),
  );
  return rows.length > 0;
}

export async function deleteCollection(userId: string, id: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const rows = await wrap("delete a collection", () =>
    db()
      .delete(collections)
      .where(and(eq(collections.id, id), eq(collections.userId, userId)))
      .returning({ id: collections.id }),
  );
  return rows.length > 0;
}

/** Visible to its owner, or to anyone once it is public. */
export async function getCollection(
  id: string,
  viewerId: string | null,
): Promise<CollectionDetail | null> {
  if (!UUID.test(id)) return null;
  return wrap("load a collection", async () => {
    const [row] = await db()
      .select({
        id: collections.id,
        title: collections.title,
        isPublic: collections.isPublic,
        userId: collections.userId,
        ownerName: users.name,
      })
      .from(collections)
      .innerJoin(users, eq(users.id, collections.userId))
      .where(eq(collections.id, id));
    if (!row || (!row.isPublic && row.userId !== viewerId)) return null;
    const items = await db()
      .select({ placeId: collectionItems.placeId, note: collectionItems.note })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, id))
      .orderBy(asc(collectionItems.position));
    const cards = await getPlaceCards(items.map((i) => i.placeId));
    const notes = new Map(items.map((i) => [i.placeId, i.note]));
    return {
      ...row,
      items: cards.map((place) => ({ place, note: notes.get(place.id) ?? null })),
    };
  });
}

async function owns(userId: string, collectionId: string): Promise<boolean> {
  if (!UUID.test(collectionId)) return false;
  const [row] = await db()
    .select({ id: collections.id })
    .from(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)));
  return Boolean(row);
}

async function touch(collectionId: string) {
  await db()
    .update(collections)
    .set({ updatedAt: new Date() })
    .where(eq(collections.id, collectionId));
}

export type AddResult = "added" | "already" | "full" | "not_found";

export async function addToCollection(
  userId: string,
  collectionId: string,
  placeId: string,
): Promise<AddResult> {
  if (!UUID.test(placeId)) return "not_found";
  return wrap("save a place", async () => {
    if (!(await owns(userId, collectionId))) return "not_found";
    const [stats] = await db()
      .select({ n: count(), last: max(collectionItems.position) })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, collectionId));
    if ((stats?.n ?? 0) >= MAX_ITEMS_PER_COLLECTION) return "full";
    const [placeCard] = await getPlaceCards([placeId]);
    if (!placeCard) return "not_found";
    const inserted = await db()
      .insert(collectionItems)
      .values({ collectionId, placeId, position: (stats?.last ?? -1) + 1 })
      .onConflictDoNothing()
      .returning({ placeId: collectionItems.placeId });
    if (inserted.length === 0) return "already";
    await touch(collectionId);
    return "added";
  });
}

export async function removeFromCollection(
  userId: string,
  collectionId: string,
  placeId: string,
): Promise<boolean> {
  if (!UUID.test(placeId)) return false;
  return wrap("remove a place", async () => {
    if (!(await owns(userId, collectionId))) return false;
    await db()
      .delete(collectionItems)
      .where(
        and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.placeId, placeId)),
      );
    await touch(collectionId);
    return true;
  });
}

/** Swaps a place with its neighbour above or below. */
export async function moveInCollection(
  userId: string,
  collectionId: string,
  placeId: string,
  direction: "up" | "down",
): Promise<boolean> {
  if (!UUID.test(placeId)) return false;
  return wrap("reorder a collection", async () => {
    if (!(await owns(userId, collectionId))) return false;
    return db().transaction(async (tx) => {
      const [current] = await tx
        .select({ position: collectionItems.position })
        .from(collectionItems)
        .where(
          and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.placeId, placeId)),
        );
      if (!current) return false;
      const [neighbour] = await tx
        .select({ placeId: collectionItems.placeId, position: collectionItems.position })
        .from(collectionItems)
        .where(
          and(
            eq(collectionItems.collectionId, collectionId),
            direction === "up"
              ? lt(collectionItems.position, current.position)
              : gt(collectionItems.position, current.position),
          ),
        )
        .orderBy(
          direction === "up" ? desc(collectionItems.position) : asc(collectionItems.position),
        )
        .limit(1);
      if (!neighbour) return false;
      const at = (id: string) =>
        and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.placeId, id));
      await tx.update(collectionItems).set({ position: neighbour.position }).where(at(placeId));
      await tx
        .update(collectionItems)
        .set({ position: current.position })
        .where(at(neighbour.placeId));
      return true;
    });
  });
}

export async function setItemNote(
  userId: string,
  collectionId: string,
  placeId: string,
  note: string | null,
): Promise<boolean> {
  if (!UUID.test(placeId)) return false;
  return wrap("save a note", async () => {
    if (!(await owns(userId, collectionId))) return false;
    const rows = await db()
      .update(collectionItems)
      .set({ note })
      .where(
        and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.placeId, placeId)),
      )
      .returning({ placeId: collectionItems.placeId });
    return rows.length > 0;
  });
}
