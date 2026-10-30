import type { PlaceHours } from "@/lib/db/schema";

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type WeekdayKey = "1" | "2" | "3" | "4" | "5" | "6" | "7";
export type WeeklyHours = NonNullable<PlaceHours["weekly"]>;

const DAY_NAMES: Record<string, Weekday> = {
  mon: 1,
  monday: 1,
  mondays: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  tuesdays: 2,
  wed: 3,
  wednesday: 3,
  wednesdays: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  thursdays: 4,
  fri: 5,
  friday: 5,
  fridays: 5,
  sat: 6,
  saturday: 6,
  saturdays: 6,
  sun: 7,
  sunday: 7,
  sundays: 7,
};

const DASH = "[-\\u2013\\u2014]|\\bto\\b";

/**
 * Text that qualifies the hours by season, month, or "it depends" cannot be
 * turned into a reliable weekly schedule. A wrong "Open now" is worse than none.
 */
const UNRELIABLE =
  /seasonal|weather|typically|varies|various|check|\(|\bfrom\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b|year-round,|dawn|dusk/i;

function parseTime(raw: string, fallbackMeridiem?: "am" | "pm"): number | null {
  const s = raw.trim().toLowerCase();
  if (s === "midnight") return 24 * 60;
  if (s === "noon") return 12 * 60;
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/.exec(s);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2] ?? 0);
  const meridiem = (m[3] as "am" | "pm" | undefined) ?? fallbackMeridiem;
  if (!meridiem || hour < 1 || hour > 12 || minute > 59) return null;
  if (hour === 12) hour = 0;
  if (meridiem === "pm") hour += 12;
  return hour * 60 + minute;
}

function parseTimeRange(raw: string): [number, number] | null {
  const parts = raw.split(new RegExp(`\\s*(?:${DASH})\\s*`, "i"));
  if (parts.length !== 2) return null;
  const [a, b] = parts as [string, string];
  const closeMeridiem = /pm\s*$/i.test(b) ? "pm" : /am\s*$/i.test(b) ? "am" : undefined;
  const close = parseTime(b);
  // "1-5pm": the opening time borrows the closing meridiem.
  const open = parseTime(a, closeMeridiem);
  if (open === null || close === null) return null;
  return [open, close <= open ? close + 24 * 60 : close];
}

function parseDays(raw: string): Weekday[] | null {
  const s = raw.trim().toLowerCase();
  if (s === "daily" || s === "every day" || s === "open daily") return [1, 2, 3, 4, 5, 6, 7];
  if (s === "weekdays") return [1, 2, 3, 4, 5];
  if (s === "weekends") return [6, 7];
  const days: Weekday[] = [];
  for (const piece of s.split(/\s*(?:,|&|\band\b)\s*/)) {
    const range = piece.split(new RegExp(`\\s*(?:${DASH})\\s*`, "i"));
    if (range.length === 1) {
      const d = DAY_NAMES[range[0] ?? ""];
      if (!d) return null;
      days.push(d);
    } else if (range.length === 2) {
      const from = DAY_NAMES[range[0] ?? ""];
      const to = DAY_NAMES[range[1] ?? ""];
      if (!from || !to) return null;
      // Ranges may wrap, as in "Sun to Thu".
      for (let d = from, n = 0; n < 7; n++) {
        days.push(d);
        if (d === to) break;
        d = ((d % 7) + 1) as Weekday;
      }
    } else return null;
  }
  return days.length ? days : null;
}

function format(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Parses curator-written hours like "Mon-Fri 9am-5pm, Sat 10am-4pm; closed Sun"
 * into a weekly schedule. Returns null whenever the text is not a plain,
 * unconditional weekly schedule.
 */
export function parseWeeklyHours(text: string): WeeklyHours | null {
  if (UNRELIABLE.test(text)) return null;
  const [main, ...notes] = text.split(";").map((s) => s.trim());
  if (!main) return null;
  // Notes after a semicolon are fine only if they restate closures.
  if (notes.some((n) => n && !/^closed\b/i.test(n) && !/hours vary$/i.test(n))) return null;

  const body = main.replace(/^year-round:\s*/i, "");
  const weekly: WeeklyHours = {};
  // Segments are "DAYS TIME-TIME", separated by commas.
  const segments = body.split(/,\s*(?=[A-Za-z])/);
  for (const segment of segments) {
    const m = /^([A-Za-z][A-Za-z\s,&\-–]*?)\s+(\d.*|noon.*|midnight.*)$/.exec(segment.trim());
    if (!m) return null;
    const days = parseDays(m[1] ?? "");
    const range = parseTimeRange(m[2] ?? "");
    if (!days || !range) return null;
    for (const day of days) {
      const key = String(day) as WeekdayKey;
      (weekly[key] ??= []).push([format(range[0]), format(range[1])]);
    }
  }
  return Object.keys(weekly).length ? weekly : null;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export type OpenStatus =
  | { state: "open"; closesAt: string }
  | { state: "closed"; opensAt: string | null; opensDay: Weekday | null };

/** Weekday and minutes since midnight in the given time zone. */
export function zonedNow(now: Date, timeZone: string): { day: Weekday; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = DAY_NAMES[get("weekday").toLowerCase()] ?? 1;
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function label(minutes: number): string {
  const m = minutes % (24 * 60);
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const suffix = h24 < 12 ? "am" : "pm";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return mm ? `${h12}:${String(mm).padStart(2, "0")}${suffix}` : `${h12}${suffix}`;
}

/** Whether a place is open at `now`, in the place's time zone. */
export function openStatus(
  weekly: WeeklyHours,
  now: Date,
  timeZone = "America/Toronto",
): OpenStatus {
  const { day, minutes } = zonedNow(now, timeZone);
  const yesterday = (((day + 5) % 7) + 1) as Weekday;

  // Spillover past midnight from yesterday, as in "11am to 1am".
  for (const [open, close] of weekly[String(yesterday) as WeekdayKey] ?? []) {
    const c = toMinutes(close);
    if (c > 24 * 60 && minutes < c - 24 * 60 && toMinutes(open) <= 24 * 60) {
      return { state: "open", closesAt: label(c) };
    }
  }
  for (const [open, close] of weekly[String(day) as WeekdayKey] ?? []) {
    if (minutes >= toMinutes(open) && minutes < toMinutes(close)) {
      return { state: "open", closesAt: label(toMinutes(close)) };
    }
  }
  // Next opening: later today, then the following six days.
  for (let offset = 0; offset < 7; offset++) {
    const d = (((day - 1 + offset) % 7) + 1) as Weekday;
    const slots = (weekly[String(d) as WeekdayKey] ?? [])
      .map(([o]) => toMinutes(o))
      .filter((o) => offset > 0 || o > minutes)
      .sort((a, b) => a - b);
    const first = slots[0];
    if (first !== undefined) return { state: "closed", opensAt: label(first), opensDay: d };
  }
  return { state: "closed", opensAt: null, opensDay: null };
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};
