import { describe, expect, it } from "vitest";
import { fuzzyScore, normalize } from "@/lib/domain/fuzzy";

describe("fuzzyScore", () => {
  it("matches prefixes, substrings, and accents", () => {
    expect(fuzzyScore("rich", "Richmond Hill")).not.toBeNull();
    expect(fuzzyScore("hill", "Richmond Hill")).not.toBeNull();
    expect(fuzzyScore("cafe", "Café Pamenar")).not.toBeNull();
  });

  it("tolerates one typo in longer words", () => {
    expect(fuzzyScore("musuem", "Aga Khan Museum")).not.toBeNull();
    expect(fuzzyScore("librray", "Markham Public Library")).not.toBeNull();
  });

  it("requires every word to match", () => {
    expect(fuzzyScore("free museum", "Aga Khan Museum")).toBeNull();
    expect(fuzzyScore("xyz", "Newmarket")).toBeNull();
  });

  it("ranks start-of-name and exact words above looser matches", () => {
    const start = fuzzyScore("park", "Park Drive Reservoir") ?? 0;
    const inside = fuzzyScore("park", "Riverwalk Commons parkette") ?? 0;
    const typo = fuzzyScore("prak", "Park Drive Reservoir") ?? 0;
    expect(start).toBeGreaterThan(inside);
    expect(inside).toBeGreaterThan(typo);
  });

  it("normalizes punctuation", () => {
    expect(normalize("Farmers' Market, Downtown")).toBe("farmers market downtown");
  });
});
