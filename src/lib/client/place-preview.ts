"use client";

import type { PlacePreview } from "@/lib/data/types";

/** Not `place`: the map already uses that for its selected pin. */
export const PREVIEW_PARAM = "preview";

/** True once a click has added a history entry that closing can step back over. */
let pushed = false;

export function openPlacePreview(placeId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(PREVIEW_PARAM, placeId);
  window.history.pushState(null, "", url);
  pushed = true;
}

/** Steps back when it can, so Back never reopens what was just closed. */
export function closePlacePreview() {
  if (pushed) {
    pushed = false;
    window.history.back();
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.delete(PREVIEW_PARAM);
  window.history.replaceState(null, "", url);
}

const loads = new Map<string, Promise<PlacePreview>>();

/** Started on hover and reused on click, so the panel usually opens already filled. */
export function loadPlacePreview(placeId: string): Promise<PlacePreview> {
  const cached = loads.get(placeId);
  if (cached) return cached;
  const load = fetch(`/api/places/${encodeURIComponent(placeId)}`).then((res) => {
    if (!res.ok) throw new Error(`Place preview failed with ${res.status}`);
    return res.json() as Promise<PlacePreview>;
  });
  loads.set(placeId, load);
  load.catch(() => loads.delete(placeId));
  return load;
}
