import { describe, expect, it } from "vitest";
import { costNote } from "@/lib/domain/cost";

describe("costNote", () => {
  it("does not repeat the Free badge", () => {
    expect(costNote("free", null)).toBeNull();
  });

  it("prefers what the listing says", () => {
    expect(costNote("free", "Free to browse.")).toBe("Free to browse.");
    expect(costNote("varies", "Tickets vary by show.")).toBe("Tickets vary by show.");
  });

  it("falls back to the band's range", () => {
    expect(costNote("low", null)).toBe("Under $20");
  });
});
