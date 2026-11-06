"use client";

import { createLocalStore } from "./local-store";

/** Places saved on this device. No account needed. Newest first. */
export const savedPlaces = createLocalStore<string[]>("cityroots:saved", []);

/** The last city the visitor looked at. Links and defaults follow it. */
export const homeCity = createLocalStore<string | null>("cityroots:city", null);

export function toggleSaved(placeId: string): boolean {
  const current = savedPlaces.read();
  const saved = current.includes(placeId);
  savedPlaces.write(saved ? current.filter((id) => id !== placeId) : [placeId, ...current]);
  return !saved;
}
