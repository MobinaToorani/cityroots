import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PLANNER_INTERESTS } from "@/lib/domain/planner";

type Listing = { id: string; category: string; cost: string; website?: string };

const dir = "scripts/seed-data/cities";
const cities = readdirSync(dir).map((file) => ({
  file,
  places: (JSON.parse(readFileSync(`${dir}/${file}`, "utf8")) as { places: Listing[] }).places,
}));

describe("volunteer listings", () => {
  it("exist in every city, and each links to a page to check", () => {
    expect(cities).toHaveLength(10);
    for (const { file, places } of cities) {
      const listings = places.filter((p) => p.category === "volunteer");
      expect(listings.length, file).toBeGreaterThan(0);
      for (const p of listings) {
        expect(p.website, p.id).toMatch(/^https:\/\//);
        expect(p.cost, p.id).toBe("free");
      }
    }
  });

  it("are not offered as a Planner interest, because they need signing up ahead", () => {
    expect(PLANNER_INTERESTS).not.toContain("volunteer");
  });
});
