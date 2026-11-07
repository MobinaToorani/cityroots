import { describe, expect, it } from "vitest";
import { whereLine } from "@/lib/domain/where";

describe("whereLine", () => {
  it("joins a neighbourhood and a city", () => {
    expect(whereLine("Kerr Village", "Oakville")).toBe("Kerr Village, Oakville");
  });
  it("does not repeat a city the neighbourhood already names", () => {
    expect(whereLine("Downtown Burlington", "Burlington")).toBe("Downtown Burlington");
    expect(whereLine("Burlington", "Burlington")).toBe("Burlington");
  });
  it("falls back to whichever part exists", () => {
    expect(whereLine(null, "Waterloo")).toBe("Waterloo");
    expect(whereLine("Uptown", null)).toBe("Uptown");
    expect(whereLine(null, null)).toBe("");
  });
});
