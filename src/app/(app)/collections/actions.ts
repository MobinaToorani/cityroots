"use server";

import type { Route } from "next";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { currentUser, requireUser } from "@/lib/auth/session";
import {
  addToCollection,
  collectionsForPlace,
  countCollections,
  createCollection,
  deleteCollection,
  listCollections,
  moveInCollection,
  removeFromCollection,
  setItemNote,
  updateCollection,
  type CollectionChoice,
} from "@/lib/data/collections";
import { getMembership } from "@/lib/data/subscriptions";
import { collectionNoteSchema, collectionTitleSchema } from "@/lib/domain/collection";
import { FREE_COLLECTION_LIMIT } from "@/lib/domain/subscription";
import { logger } from "@/lib/logger";

export type CreateCollectionState = {
  status: "idle" | "error";
  message?: string;
  title?: string;
};

const LIMIT_MESSAGE = `Free accounts can keep ${FREE_COLLECTION_LIMIT} collections. Add places to one you have, or go Pro for as many as you like.`;

async function canCreateCollection(userId: string): Promise<boolean> {
  const { pro } = await getMembership(userId);
  return pro || (await countCollections(userId)) < FREE_COLLECTION_LIMIT;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** The new-collection form on /collections and on the save page. */
export async function createCollectionAction(
  _prev: CreateCollectionState,
  formData: FormData,
): Promise<CreateCollectionState> {
  const user = await requireUser("/collections");
  const raw = text(formData, "title");
  const parsed = collectionTitleSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message, title: raw };
  }
  if (!(await canCreateCollection(user.id))) {
    return { status: "error", message: LIMIT_MESSAGE, title: raw };
  }
  const { id } = await createCollection(user.id, parsed.data);
  const placeId = text(formData, "placeId");
  if (placeId) {
    await addToCollection(user.id, id, placeId);
    redirect(safeRedirectPath(formData.get("returnTo"), `/collections/${id}`) as Route);
  }
  redirect(`/collections/${id}` as Route);
}

const DEVICE_LIST_TITLE = "Saved places";

/** Moves places saved on this device into the member's account, so they follow them around. */
export async function keepSavedPlacesAction(formData: FormData): Promise<void> {
  const user = await requireUser("/saved");
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, 200);
  const [existing, membership] = await Promise.all([
    listCollections(user.id),
    getMembership(user.id),
  ]);
  const target =
    existing.find((c) => c.title === DEVICE_LIST_TITLE) ??
    (membership.pro || existing.length < FREE_COLLECTION_LIMIT
      ? await createCollection(user.id, DEVICE_LIST_TITLE)
      : existing[0]);
  if (!target) redirect("/collections");
  for (const id of ids) await addToCollection(user.id, target.id, id);
  redirect(`/collections/${target.id}` as Route);
}

export async function renameCollectionAction(formData: FormData): Promise<void> {
  const user = await requireUser("/collections");
  const parsed = collectionTitleSchema.safeParse(text(formData, "title"));
  if (!parsed.success) return;
  await updateCollection(user.id, text(formData, "id"), { title: parsed.data });
  refresh();
}

export async function setCollectionVisibilityAction(formData: FormData): Promise<void> {
  const user = await requireUser("/collections");
  await updateCollection(user.id, text(formData, "id"), {
    isPublic: text(formData, "isPublic") === "true",
  });
  refresh();
}

export async function deleteCollectionAction(formData: FormData): Promise<void> {
  const user = await requireUser("/collections");
  await deleteCollection(user.id, text(formData, "id"));
  redirect("/collections?deleted=1");
}

/** Remove, move up, move down, or save a note on one place in a collection. */
export async function collectionItemAction(formData: FormData): Promise<void> {
  const user = await requireUser("/collections");
  const id = text(formData, "id");
  const placeId = text(formData, "placeId");
  const intent = text(formData, "intent");
  if (intent === "remove") await removeFromCollection(user.id, id, placeId);
  else if (intent === "up" || intent === "down") {
    await moveInCollection(user.id, id, placeId, intent);
  } else if (intent === "note") {
    const note = collectionNoteSchema.safeParse(text(formData, "note"));
    if (note.success) await setItemNote(user.id, id, placeId, note.data);
  }
  refresh();
}

/** The no-JavaScript save page: makes the place's memberships match the ticked boxes. */
export async function saveToCollectionsAction(formData: FormData): Promise<void> {
  const placeId = text(formData, "placeId");
  const user = await requireUser(`/collections/save?place=${encodeURIComponent(placeId)}`);
  const wanted = new Set(formData.getAll("collection").filter((v) => typeof v === "string"));
  const choices = await collectionsForPlace(user.id, placeId);
  for (const c of choices) {
    if (wanted.has(c.id) && !c.hasPlace) await addToCollection(user.id, c.id, placeId);
    if (!wanted.has(c.id) && c.hasPlace) await removeFromCollection(user.id, c.id, placeId);
  }
  redirect(safeRedirectPath(formData.get("returnTo"), `/places/${placeId}`) as Route);
}

/* ------------------------------------------------------------------ */
/* Called from the save dialog                                         */
/* ------------------------------------------------------------------ */

export type SaveDialogState =
  | { signedIn: false }
  | {
      signedIn: true;
      choices: CollectionChoice[];
      canCreate: boolean;
      freeLimit: number;
      error?: string;
      message?: string;
    };

async function dialogState(
  userId: string,
  placeId: string,
  extra: { error?: string; message?: string } = {},
): Promise<SaveDialogState> {
  const [choices, canCreate] = await Promise.all([
    collectionsForPlace(userId, placeId),
    canCreateCollection(userId),
  ]);
  return { signedIn: true, choices, canCreate, freeLimit: FREE_COLLECTION_LIMIT, ...extra };
}

export async function loadSaveDialog(placeId: string): Promise<SaveDialogState> {
  const user = await currentUser();
  if (!user) return { signedIn: false };
  return dialogState(user.id, placeId);
}

export async function toggleSavedAction(
  collectionId: string,
  placeId: string,
  saved: boolean,
): Promise<SaveDialogState> {
  const user = await currentUser();
  if (!user) return { signedIn: false };
  try {
    if (saved) {
      const result = await addToCollection(user.id, collectionId, placeId);
      if (result === "full") {
        return dialogState(user.id, placeId, {
          error: "That collection is full. Start a new one for this place.",
        });
      }
    } else {
      await removeFromCollection(user.id, collectionId, placeId);
    }
  } catch (error) {
    logger.error("Save toggle failed", { error, collectionId, placeId });
    return dialogState(user.id, placeId, { error: "That did not save. Try again." });
  }
  return dialogState(user.id, placeId);
}

export async function createAndSaveAction(
  title: string,
  placeId: string,
): Promise<SaveDialogState> {
  const user = await currentUser();
  if (!user) return { signedIn: false };
  const parsed = collectionTitleSchema.safeParse(title);
  if (!parsed.success) {
    return dialogState(user.id, placeId, { error: parsed.error.issues[0]?.message });
  }
  if (!(await canCreateCollection(user.id))) {
    return dialogState(user.id, placeId, { error: LIMIT_MESSAGE });
  }
  try {
    const { id } = await createCollection(user.id, parsed.data);
    await addToCollection(user.id, id, placeId);
  } catch (error) {
    logger.error("Create collection failed", { error });
    return dialogState(user.id, placeId, { error: "That did not save. Try again." });
  }
  return dialogState(user.id, placeId, { message: `Saved to ${parsed.data}` });
}
