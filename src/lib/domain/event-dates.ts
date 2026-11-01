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
