import { describe, expect, it } from "vitest";
import { rank, relevanceScore, type RankingSignals } from "@/lib/domain/ranking";

const now = new Date("2026-10-30T00:00:00Z");

function item(name: string, signals: Partial<RankingSignals> = {}) {
  return {
    name,
    signals: {
      costBand: "free",
      isPick: false,
      tipCount: 0,
      saveCount: 0,
      lastVerifiedAt: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      textScore: 0,
      ...signals,
    } satisfies RankingSignals,
  };
}

describe("rank", () => {
  it("puts free listings first by default even when a paid one scores higher", () => {
    const items = [
      item("Busy paid place", { costBand: "low", isPick: true, saveCount: 500, tipCount: 40 }),
      item("Quiet free place", { costBand: "free" }),
    ];
    expect(rank(items, "relevance", now).map((i) => i.name)).toEqual([
      "Quiet free place",
      "Busy paid place",
    ]);
  });

  it("orders by score within the same cost bucket", () => {
    const items = [
      item("Plain"),
      item("Picked", { isPick: true }),
      item("Saved", { saveCount: 50 }),
    ];
    expect(rank(items, "relevance", now).map((i) => i.name)).toEqual(["Saved", "Picked", "Plain"]);
  });

  it("cost sort follows the full band order", () => {
    const items = [
      item("V", { costBand: "varies" }),
      item("M", { costBand: "moderate" }),
      item("L", { costBand: "low" }),
      item("F", { costBand: "free" }),
    ];
    expect(rank(items, "cost", now).map((i) => i.name)).toEqual(["F", "L", "M", "V"]);
  });

  it("newest sort is chronological", () => {
    const items = [
      item("Old", { createdAt: new Date("2025-01-01") }),
      item("New", { createdAt: new Date("2026-06-01"), costBand: "moderate" }),
    ];
    expect(rank(items, "newest", now).map((i) => i.name)).toEqual(["New", "Old"]);
  });

  it("breaks ties by name so order is stable", () => {
    expect(rank([item("b"), item("a")], "relevance", now).map((i) => i.name)).toEqual(["a", "b"]);
  });

  it("rewards recent verification and fades it over a year", () => {
    const fresh = relevanceScore(
      item("x", { lastVerifiedAt: new Date("2026-10-01") }).signals,
      now,
    );
    const stale = relevanceScore(
      item("x", { lastVerifiedAt: new Date("2024-10-01") }).signals,
      now,
    );
    expect(fresh).toBeGreaterThan(stale);
    expect(stale).toBe(0);
  });

  it("does not mutate its input", () => {
    const items = [item("b"), item("a")];
    rank(items, "relevance", now);
    expect(items.map((i) => i.name)).toEqual(["b", "a"]);
  });
});
