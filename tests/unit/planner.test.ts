import { describe, expect, it } from "vitest";
import {
  assemblePlan,
  estimateCost,
  nextSaturday,
  plannerParamsSchema,
  savePlanSchema,
  weekdayOf,
  type PlannerCandidate,
} from "@/lib/domain/planner";

let n = 0;
function place(
  p: Partial<PlannerCandidate> & Pick<PlannerCandidate, "category">,
): PlannerCandidate {
  n += 1;
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    name: `${p.category} ${n}`,
    kind: "place",
    costBand: "free",
    priceNote: null,
    neighborhood: null,
    weekly: null,
    inSeason: false,
    ...p,
  };
}

const SATURDAY = 6;

describe("estimateCost", () => {
  it("is zero for free listings whatever the note says", () => {
    expect(estimateCost({ costBand: "free", priceNote: "$5 parking" })).toBe(0);
  });
  it("reads the first price in the note, rounded up", () => {
    expect(estimateCost({ costBand: "low", priceNote: "Drop-in $4.50, or $40 for ten" })).toBe(5);
  });
  it("ignores memberships and passes", () => {
    expect(estimateCost({ costBand: "low", priceNote: "$60 a year membership" })).toBe(10);
  });
  it("falls back to the band's typical spend", () => {
    expect(estimateCost({ costBand: "moderate", priceNote: null })).toBe(30);
  });
});

describe("assemblePlan", () => {
  const cafe = place({ category: "cafes", costBand: "low", priceNote: "Coffee about $5" });
  const trail = place({ category: "physical" });
  const library = place({ category: "mental" });
  const lunch = place({ category: "food", costBand: "low", priceNote: "Mains $12" });
  const pricey = place({ category: "food", costBand: "moderate" });
  const gallery = place({ category: "arts" });
  const festival = place({ category: "events", kind: "event", inSeason: true });
  const offSeason = place({ category: "events", kind: "event", inSeason: false });
  const all = [cafe, trail, library, pricey, lunch, gallery, offSeason, festival];

  it("fills each slot once, in order, within budget", () => {
    const plan = assemblePlan({ candidates: all, budget: 25, interests: [], weekday: SATURDAY });
    expect(plan.stops.map((s) => s.slot)).toEqual([
      "morning",
      "free",
      "lunch",
      "afternoon",
      "evening",
    ]);
    expect(new Set(plan.stops.map((s) => s.placeId)).size).toBe(plan.stops.length);
    expect(plan.total).toBeLessThanOrEqual(25);
    expect(plan.total).toBe(17);
  });

  it("skips a ranked option that would break the budget", () => {
    const plan = assemblePlan({ candidates: all, budget: 25, interests: [], weekday: SATURDAY });
    expect(plan.stops.find((s) => s.slot === "lunch")?.placeId).toBe(lunch.id);
  });

  it("keeps money back so later slots are not left empty", () => {
    const plan = assemblePlan({ candidates: all, budget: 12, interests: [], weekday: SATURDAY });
    // Taking the only cafe for coffee would leave lunch with just the $12 option
    // and $7 to spend, so coffee is dropped and lunch is still covered.
    expect(plan.skipped.map((s) => s.slot)).toEqual(["morning"]);
    expect(plan.stops.find((s) => s.slot === "lunch")).toBeDefined();
    expect(plan.total).toBeLessThanOrEqual(12);
  });

  it("builds an all-free day on a $0 budget", () => {
    const plan = assemblePlan({ candidates: all, budget: 0, interests: [], weekday: SATURDAY });
    expect(plan.total).toBe(0);
    expect(plan.stops.every((s) => s.estimate === 0)).toBe(true);
  });

  it("never uses an event that is out of season", () => {
    const plan = assemblePlan({ candidates: all, budget: 50, interests: [], weekday: SATURDAY });
    expect(plan.stops.map((s) => s.placeId)).not.toContain(offSeason.id);
  });

  it("puts interests first within a slot", () => {
    const plan = assemblePlan({
      candidates: all,
      budget: 25,
      interests: ["mental"],
      weekday: SATURDAY,
    });
    expect(plan.stops.find((s) => s.slot === "free")?.placeId).toBe(library.id);
  });

  it("leaves out places known to be closed at that time", () => {
    const closedSaturday = place({
      category: "cafes",
      weekly: { "1": [["08:00", "16:00"]] },
    });
    const plan = assemblePlan({
      candidates: [closedSaturday, ...all],
      budget: 25,
      interests: [],
      weekday: SATURDAY,
    });
    expect(plan.stops[0]?.placeId).toBe(cafe.id);
    expect(plan.stops[0]?.hoursKnown).toBe(false);
  });

  it("rotates choices with a seed and offers in-budget alternatives", () => {
    const first = assemblePlan({ candidates: all, budget: 50, interests: [], weekday: SATURDAY });
    const second = assemblePlan({
      candidates: all,
      budget: 50,
      interests: [],
      weekday: SATURDAY,
      seed: 1,
    });
    expect(second.stops.find((s) => s.slot === "free")?.placeId).not.toBe(
      first.stops.find((s) => s.slot === "free")?.placeId,
    );
    for (const stop of first.stops) {
      for (const alt of stop.alternatives) {
        expect(first.total - stop.estimate + alt.estimate).toBeLessThanOrEqual(50);
      }
    }
  });
});

describe("planner input", () => {
  const today = "2026-10-30";

  it("finds the coming Saturday", () => {
    expect(weekdayOf(today)).toBe(5);
    expect(nextSaturday(today)).toBe("2026-10-31");
    expect(nextSaturday("2026-10-31")).toBe("2026-10-31");
  });

  it("accepts a valid request and rejects past days", () => {
    const schema = plannerParamsSchema(today);
    expect(
      schema.safeParse({ city: "newmarket", day: "2026-11-07", budget: "25", interests: ["arts"] })
        .success,
    ).toBe(true);
    expect(schema.safeParse({ city: "newmarket", day: "2026-10-01", budget: "25" }).success).toBe(
      false,
    );
  });

  it("rejects unknown slots and empty plans when saving", () => {
    expect(savePlanSchema.safeParse({ city: "x", day: today, budget: 10, stops: [] }).success).toBe(
      false,
    );
    expect(
      savePlanSchema.safeParse({
        city: "x",
        day: today,
        budget: 10,
        stops: [{ placeId: "00000000-0000-4000-8000-000000000001", slot: "brunch" }],
      }).success,
    ).toBe(false);
  });
});
