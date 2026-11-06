const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

const MONTH_RE = new RegExp(
  `\\b(${MONTHS.join("|")})\\b(?:\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b)?`,
  "gi",
);

export type DerivedEventDates = {
  startAt: Date;
  endAt: Date;
  precision: "day" | "month";
};

/**
 * Turns curator notes like "Saturdays May through October" or "Annual event
 * in June" into the next occurrence as a month range. Only an explicit day
 * ("July 1st") gives day precision. Returns null when no month is named, so
 * vague notes ("summer weekends") are never given invented dates.
 */
export function deriveEventDates(text: string, today: Date): DerivedEventDates | null {
  const found = [...text.matchAll(MONTH_RE)]
    // Lowercase "may" is the verb ("hours may vary"), not the month.
    .filter((m) => m[1] !== "may")
    .map((m) => ({
      month: MONTHS.indexOf((m[1] ?? "").toLowerCase() as (typeof MONTHS)[number]),
      day: m[2] ? Number(m[2]) : null,
    }));
  const first = found[0];
  const last = found[found.length - 1];
  if (!first || !last || first.month < 0) return null;

  // An explicit day on the first mention is the event's date ("July 1st;
  // some programming begins June 30th" is Canada Day, not a year-long span).
  const precision = first.day !== null && first.day >= 1 && first.day <= 31 ? "day" : "month";

  // Try this year, then next, and take the first occurrence that has not ended.
  for (const year of [
    today.getUTCFullYear() - 1,
    today.getUTCFullYear(),
    today.getUTCFullYear() + 1,
  ]) {
    const startAt =
      precision === "day"
        ? new Date(Date.UTC(year, first.month, first.day ?? 1))
        : new Date(Date.UTC(year, first.month, 1));
    const endYear = last.month < first.month ? year + 1 : year;
    const endAt =
      precision === "day"
        ? new Date(Date.UTC(year, first.month, (first.day ?? 1) + 1) - 1)
        : new Date(Date.UTC(endYear, last.month + 1, 1) - 1);
    if (endAt.getTime() >= today.getTime()) return { startAt, endAt, precision };
  }
  return null;
}

/** Plain-language date label. Month precision always says "usually". */
export function eventDateLabel(
  startAt: Date,
  endAt: Date | null,
  precision: "day" | "month",
): string {
  const month = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { month: "long", timeZone: "UTC" }).format(d);
  if (precision === "day") {
    return new Intl.DateTimeFormat("en-CA", {
      weekday: "short",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(startAt);
  }
  if (!endAt || month(startAt) === month(endAt)) return `Usually in ${month(startAt)}`;
  return `Usually ${month(startAt)} to ${month(endAt)}`;
}

/** First day of each month an event touches, for grouping a calendar. */
export function monthsCovered(startAt: Date, endAt: Date | null): Date[] {
  const out: Date[] = [];
  const end = endAt ?? startAt;
  let y = startAt.getUTCFullYear();
  let m = startAt.getUTCMonth();
  while (y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth())) {
    out.push(new Date(Date.UTC(y, m, 1)));
    m++;
    if (m === 12) {
      m = 0;
      y++;
    }
    if (out.length > 12) break;
  }
  return out;
}

/* -------------------------------- agenda --------------------------------- */

const TZ = "America/Toronto";

export const EVENT_WHEN = ["today", "tomorrow", "weekend", "week", "later"] as const;
export type EventWhen = (typeof EVENT_WHEN)[number];

export const EVENT_WHEN_LABELS: Record<EventWhen, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  weekend: "This weekend",
  week: "Next 7 days",
  later: "Later",
};

/** YYYY-MM-DD on Toronto's calendar. */
export function torontoDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date);
}

function shiftDay(key: string, days: number): string {
  return new Date(Date.parse(`${key}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

/** The inclusive range of Toronto days a "when" covers. */
export function whenRange(when: EventWhen, now: Date): { from: string; to: string } {
  const today = torontoDayKey(now);
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  switch (when) {
    case "today":
      return { from: today, to: today };
    case "tomorrow": {
      const tomorrow = shiftDay(today, 1);
      return { from: tomorrow, to: tomorrow };
    }
    case "weekend": {
      if (weekday === 0) return { from: today, to: today };
      const saturday = shiftDay(today, 6 - weekday);
      return { from: saturday, to: shiftDay(saturday, 1) };
    }
    case "week":
      return { from: today, to: shiftDay(today, 6) };
    case "later":
      return { from: shiftDay(today, 7), to: "9999-12-31" };
  }
}

export type AgendaInput = {
  startAt: Date;
  endAt: Date | null;
  precision: "day" | "month";
  occurrences: string[] | null;
};

export type AgendaEntry<T> = {
  event: T;
  at: Date;
  /** False for events known only by date, which have no time to show. */
  timed: boolean;
};

export type AgendaDay<T> = { key: string; label: string; entries: AgendaEntry<T>[] };

export type Agenda<T> = {
  /** Short runs and one-offs, grouped by day ("later" groups by month). */
  days: AgendaDay<T>[];
  /** Exhibits and markets with many dates. Listing them on every day would bury the rest. */
  running: AgendaEntry<T>[];
  /** Known only by month, so never promised on a day. */
  seasonal: T[];
};

const clock = new Intl.DateTimeFormat("en-CA", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TZ,
});

/** Feeds use midnight for "all day" or "no time given". */
const MIDNIGHT = clock.format(new Date("2026-01-01T05:00:00Z"));

/** More showings than this makes something an ongoing run rather than a dated event. */
const RUNNING_FROM = 8;

/** The first showing inside the range that has not already finished. */
function firstShowing<T extends AgendaInput>(
  event: T,
  range: { from: string; to: string },
  now: Date,
): AgendaEntry<T> | null {
  if (event.occurrences) {
    const earliest = now.getTime() - 3 * 3_600_000;
    for (const iso of event.occurrences) {
      const at = new Date(iso);
      const key = torontoDayKey(at);
      if (key >= range.from && key <= range.to && at.getTime() >= earliest) {
        return { event, at, timed: clock.format(at) !== MIDNIGHT };
      }
    }
    return null;
  }
  // Hand-written events store a calendar date at midnight UTC, with no time of day.
  const key = event.startAt.toISOString().slice(0, 10);
  return key >= range.from && key <= range.to ? { event, at: event.startAt, timed: false } : null;
}

const longDay = new Intl.DateTimeFormat("en-CA", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});
const monthYear = new Intl.DateTimeFormat("en-CA", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function dayLabel(key: string, today: string): string {
  if (key === today) return "Today";
  if (key === shiftDay(today, 1)) return "Tomorrow";
  return longDay.format(new Date(`${key}T12:00:00Z`));
}

/** Sorts events into what the agenda shows for a chosen "when". */
export function buildAgenda<T extends AgendaInput>(
  items: readonly T[],
  when: EventWhen,
  now: Date,
): Agenda<T> {
  const range = whenRange(when, now);
  const today = torontoDayKey(now);
  const groups = new Map<string, AgendaDay<T>>();
  const running: AgendaEntry<T>[] = [];
  const seasonal: T[] = [];

  for (const event of items) {
    if (event.precision === "month") {
      const startKey = event.startAt.toISOString().slice(0, 10);
      if (when === "later" ? startKey > today : startKey <= today) seasonal.push(event);
      continue;
    }
    const entry = firstShowing(event, range, now);
    if (!entry) continue;
    if ((event.occurrences?.length ?? 0) >= RUNNING_FROM) {
      running.push(entry);
      continue;
    }
    const dayKey = event.occurrences
      ? torontoDayKey(entry.at)
      : entry.at.toISOString().slice(0, 10);
    const key = when === "later" ? dayKey.slice(0, 7) : dayKey;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label:
          when === "later"
            ? monthYear.format(new Date(`${key}-15T12:00:00Z`))
            : dayLabel(key, today),
        entries: [],
      });
    }
    groups.get(key)?.entries.push(entry);
  }

  const days = [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
  for (const day of days) day.entries.sort((a, b) => a.at.getTime() - b.at.getTime());
  return { days, running, seasonal };
}

/** "7pm" or "7:30pm". */
export function showingTime(at: Date): string {
  return clock.format(at).replace(":00", "").replace(/\s|\./g, "").toLowerCase();
}

const shortDay = new Intl.DateTimeFormat("en-CA", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: TZ,
});

/** "Sat, Nov 8" for a timed showing. */
export function showingDay(at: Date): string {
  return shortDay.format(at).replace(/\./g, "");
}

const untilDay = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: TZ });

/** "Until Dec 5" for a run. */
export function runsUntil(end: Date | null): string | null {
  return end ? `Until ${untilDay.format(end).replace(/\./g, "")}` : null;
}
