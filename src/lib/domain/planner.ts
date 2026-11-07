import { z } from "zod";
import { CATEGORY_SLUGS, type CategorySlug } from "./categories";
import { TYPICAL_SPEND, type CostBand } from "./cost";
import { isOpenAt, type Weekday, type WeeklyHours } from "./hours";
import { PLAN_SLOTS, SLOT_KEYS, type Kind, type PlanSlot, type SlotKey } from "./plan-slots";

export * from "./plan-slots";

function minutesOf(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/* ------------------------------------------------------------------ */
/* Cost                                                                */
/* ------------------------------------------------------------------ */

/** Notes about passes and memberships say nothing about the cost of one visit. */
const NOT_A_VISIT = /\b(year|yearly|annual|month|monthly|season|membership|members|pass)\b/i;

/**
 * Estimated spend per person for one visit, in whole dollars. Reads the first
 * price in the listing's price note, and falls back to the cost band's typical spend.
 */
export function estimateCost(c: { costBand: CostBand; priceNote: string | null }): number {
  if (c.costBand === "free") return 0;
  const note = c.priceNote ?? "";
  const match = /\$\s?(\d{1,3}(?:\.\d{1,2})?)/.exec(note);
  if (match && !NOT_A_VISIT.test(note)) return Math.ceil(Number(match[1]));
  return TYPICAL_SPEND[c.costBand];
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

export type PlannerCandidate = {
  id: string;
  name: string;
  category: CategorySlug;
  kind: Kind;
  costBand: CostBand;
  priceNote: string | null;
  neighborhood: string | null;
  weekly: WeeklyHours | null;
  /** For event listings: whether a known run of the event covers the day. */
  inSeason: boolean;
};

export type PlanOption = { placeId: string; estimate: number };

export type PlannedStop = PlanOption & {
  slot: SlotKey;
  label: string;
  time: string;
  /** False when the listing has no reliable schedule, so the plan says to check. */
  hoursKnown: boolean;
  alternatives: PlanOption[];
};

export type DayPlan = {
  stops: PlannedStop[];
  total: number;
  budget: number;
  skipped: { slot: SlotKey; label: string }[];
};

export type PlanRequest = {
  /** Candidates in ranked order, best first. */
  candidates: readonly PlannerCandidate[];
  budget: number;
  interests: readonly CategorySlug[];
  weekday: Weekday;
  /** 0 gives the top choice in every slot; other values rotate through the next best. */
  seed?: number;
};

const ROTATION = 3;
const ALTERNATIVES = 4;

function eligibleFor(
  slot: PlanSlot,
  candidates: readonly PlannerCandidate[],
  interests: ReadonlySet<CategorySlug>,
  weekday: Weekday,
): PlannerCandidate[] {
  const at = minutesOf(slot.time);
  const fits = candidates.filter(
    (c) =>
      slot.categories.includes(c.category) &&
      slot.kinds.includes(c.kind) &&
      (!slot.freeOnly || c.costBand === "free") &&
      (c.kind !== "event" || c.inSeason) &&
      (!c.weekly || isOpenAt(c.weekly, weekday, at)),
  );
  // Stable partition: interests first, then places with known hours, keeping rank order.
  const score = (c: PlannerCandidate) => (interests.has(c.category) ? 0 : 2) + (c.weekly ? 0 : 1);
  return fits
    .map((c, i) => ({ c, i }))
    .sort((a, b) => score(a.c) - score(b.c) || a.i - b.i)
    .map(({ c }) => c);
}

/**
 * Builds a day out: coffee, something free, lunch, an afternoon stop, and an
 * evening plan, keeping the estimated total within the budget. Each slot keeps
 * enough money back for the cheapest option in the slots after it, so an early
 * splurge never leaves the evening empty.
 */
export function assemblePlan({
  candidates,
  budget,
  interests,
  weekday,
  seed = 0,
}: PlanRequest): DayPlan {
  const interestSet = new Set(interests);
  const pools = PLAN_SLOTS.map((slot) => ({
    slot,
    pool: eligibleFor(slot, candidates, interestSet, weekday),
  }));
  const used = new Set<string>();
  const stops: PlannedStop[] = [];
  const skipped: DayPlan["skipped"] = [];
  let spent = 0;

  pools.forEach(({ slot, pool }, index) => {
    // Cheapest remaining option in every later slot, without the one being
    // considered. Slots with nothing to offer will be skipped, so reserve nothing.
    const keepBack = (candidateId: string) =>
      pools.slice(index + 1).reduce((sum, later) => {
        const costs = later.pool
          .filter((c) => !used.has(c.id) && c.id !== candidateId)
          .map(estimateCost);
        return sum + (costs.length > 0 ? Math.min(...costs) : 0);
      }, 0);
    const open = pool.filter((c) => !used.has(c.id));
    const offset = open.length > 0 ? seed % Math.min(ROTATION, open.length) : 0;
    const rotated = [...open.slice(offset), ...open.slice(0, offset)];
    const pick = rotated.find((c) => spent + estimateCost(c) + keepBack(c.id) <= budget);
    if (!pick) {
      skipped.push({ slot: slot.key, label: slot.label });
      return;
    }
    used.add(pick.id);
    const estimate = estimateCost(pick);
    spent += estimate;
    stops.push({
      slot: slot.key,
      label: slot.label,
      time: slot.time,
      placeId: pick.id,
      estimate,
      hoursKnown: Boolean(pick.weekly),
      alternatives: [],
    });
  });

  // Swaps that keep the plan within budget, given everything else stays put.
  const slack = budget - spent;
  for (const stop of stops) {
    const pool = pools.find((p) => p.slot.key === stop.slot)?.pool ?? [];
    stop.alternatives = pool
      .filter((c) => !used.has(c.id) && estimateCost(c) <= stop.estimate + slack)
      .slice(0, ALTERNATIVES)
      .map((c) => ({ placeId: c.id, estimate: estimateCost(c) }));
  }

  return { stops, total: spent, budget, skipped };
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

export const BUDGET_CHOICES = [0, 10, 25, 50, 100] as const;
/** Volunteering takes signing up ahead, so it cannot be a stop in a day planned on the spot. */
export const PLANNER_INTERESTS = CATEGORY_SLUGS.filter(
  (c) => c !== "financial" && c !== "volunteer",
);
export const MAX_DAYS_AHEAD = 90;

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a day");

/** "YYYY-MM-DD" for a date in Toronto. */
export function torontoDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(day: string): Weekday {
  const js = new Date(`${day}T12:00:00Z`).getUTCDay();
  return (js === 0 ? 7 : js) as Weekday;
}

/** The coming Saturday, or today if it is Saturday. */
export function nextSaturday(today: string): string {
  return addDays(today, (6 - weekdayOf(today) + 7) % 7);
}

export function plannerParamsSchema(today: string) {
  return z.object({
    city: z.string("Choose a city").min(1, "Choose a city"),
    day: isoDay.refine(
      (d) => d >= today && d <= addDays(today, MAX_DAYS_AHEAD),
      `Choose a day between today and ${MAX_DAYS_AHEAD} days from now`,
    ),
    budget: z.coerce
      .number("Choose a budget")
      .int()
      .min(0, "Choose a budget")
      .max(500, "Keep the budget under $500"),
    interests: z.array(z.enum(PLANNER_INTERESTS)).max(PLANNER_INTERESTS.length).default([]),
    seed: z.coerce.number().int().min(0).max(99).default(0),
  });
}

export type PlannerParams = z.infer<ReturnType<typeof plannerParamsSchema>>;

/** What a member sends back when saving: the stops in their chosen order. */
export const savePlanSchema = z.object({
  city: z.string().min(1),
  day: isoDay,
  budget: z.coerce.number().int().min(0).max(500),
  interests: z.array(z.enum(PLANNER_INTERESTS)).default([]),
  stops: z
    .array(z.object({ placeId: z.uuid(), slot: z.enum(SLOT_KEYS) }))
    .min(1, "Keep at least one stop in the plan")
    .max(PLAN_SLOTS.length),
});

export function planTitle(day: string, cityName: string): string {
  const weekday = new Intl.DateTimeFormat("en-CA", { weekday: "long", timeZone: "UTC" }).format(
    new Date(`${day}T12:00:00Z`),
  );
  return `${weekday} in ${cityName}`;
}

export function dayLabel(day: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
}
