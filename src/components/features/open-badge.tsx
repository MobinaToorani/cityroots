"use client";

import { useSyncExternalStore } from "react";
import { openStatus, type WeeklyHours } from "@/lib/domain/hours";

const noSubscription = () => () => {};

/** Appears only when a place is open. Worked out in the browser, so cached pages never lie. */
export function OpenBadge({ weekly }: { weekly: WeeklyHours }) {
  const open = useSyncExternalStore(
    noSubscription,
    () => openStatus(weekly, new Date()).state === "open",
    () => false,
  );
  if (!open) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-meta font-semibold text-free">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-free" />
      Open now
    </span>
  );
}
