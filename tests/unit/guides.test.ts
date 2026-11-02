import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GUIDES } from "@/content/guides";
import { guideMetaSchema } from "@/lib/domain/guides";

const body = (slug: string) =>
  readFileSync(path.resolve(import.meta.dirname, `../../src/content/guides/${slug}.mdx`), "utf8");

describe("guides", () => {
  it("launches with six guides in six different cities", () => {
    expect(GUIDES).toHaveLength(6);
    expect(new Set(GUIDES.map((g) => g.city)).size).toBe(6);
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(6);
  });

  for (const guide of GUIDES) {
    describe(guide.slug, () => {
      it("has valid metadata", () => {
        expect(guideMetaSchema.safeParse(guide).error?.issues ?? []).toEqual([]);
        expect(guide.updatedAt >= guide.publishedAt).toBe(true);
      });

      it("visits exactly the stops its metadata lists, in order, once each", () => {
        const inBody = [...body(guide.slug).matchAll(/<Stop slug="([a-z0-9-]+)">/g)].map(
          (m) => m[1],
        );
        expect(inBody).toEqual(guide.stops);
      });

      it("keeps free guides free in its own words", () => {
        const text = body(guide.slug);
        if (guide.budget === 0) expect(text).not.toMatch(/\$\d/);
      });
    });
  }
});

describe("analytics goals", () => {
  it("tags goals as Plausible classes and never takes free text", async () => {
    const { GOALS, goal } = await import("@/lib/analytics");
    expect(goal(GOALS.checkoutStarted)).toBe("plausible-event-name=Checkout+started");
    for (const name of Object.values(GOALS)) expect(name).toMatch(/^[A-Z][a-z ]+$/);
  });
});
