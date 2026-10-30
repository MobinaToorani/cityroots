"use client";

import { useEffect, useState } from "react";
import {
  openStatus,
  WEEKDAY_LABELS,
  zonedNow,
  type OpenStatus,
  type WeeklyHours,
} from "@/lib/domain/hours";
import { cn } from "@/lib/cn";

/**
 * "Open now" against the visitor's clock. Pages are static, so the status is
 * computed after hydration and refreshed every minute; until then nothing
 * renders, which avoids showing a stale build-time answer.
 */
export function OpenNow({ weekly }: { weekly: WeeklyHours }) {
  const [state, setState] = useState<{ status: OpenStatus; today: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setState({ status: openStatus(weekly, now), today: zonedNow(now, "America/Toronto").day });
    };
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [weekly]);

  if (!state) return null;
  const { status, today } = state;
  const open = status.state === "open";
  let detail = "";
  if (status.state === "open") detail = `until ${status.closesAt}`;
  else if (status.opensAt && status.opensDay) {
    const day = status.opensDay === today ? "" : `${WEEKDAY_LABELS[status.opensDay]} `;
    detail = `opens ${day}at ${status.opensAt}`;
  }

  return (
    <p className="mb-1 flex items-center gap-2 text-body" aria-live="polite">
      <span
        aria-hidden="true"
        className={cn("size-2 rounded-full", open ? "bg-free" : "bg-text-muted")}
      />
      <span className={cn("font-semibold", open ? "text-free" : "text-text")}>
        {open ? "Open now" : "Closed now"}
      </span>
      {detail && <span className="text-text-muted">{detail}</span>}
    </p>
  );
}
