import { describe, expect, it } from "vitest";
import {
  COST_BANDS,
  COST_LABELS,
  compareCostBands,
  freeShare,
  isCostBand,
} from "@/lib/domain/cost";

describe("cost bands", () => {
  it("uses the house wording everywhere", () => {
    expect(COST_LABELS).toEqual({
      free: "Free",
      low: "Low cost",
      moderate: "Moderate",
      varies: "Varies",
    });
  });

  it("orders free first and varies last", () => {
    const shuffled = ["varies", "moderate", "free", "low"] as const;
    expect([...shuffled].sort(compareCostBands)).toEqual(["free", "low", "moderate", "varies"]);
  });

  it("recognises only known bands", () => {
    for (const band of COST_BANDS) expect(isCostBand(band)).toBe(true);
    expect(isCostBand("cheap")).toBe(false);
    expect(isCostBand("")).toBe(false);
  });

  it("computes the free share as a whole percent", () => {
    expect(freeShare([])).toBe(0);
    expect(freeShare(["free", "low", "free"])).toBe(67);
  });
});
