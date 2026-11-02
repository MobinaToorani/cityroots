import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  exploreHref,
  loadExploreState,
  normalizeExploreState,
} from "@/lib/domain/explore-params";

describe("explore URL state", () => {
  it("parses the documented example", () => {
    const state = loadExploreState("?city=newmarket&cat=cafes&cost=free&q=market&view=map");
    expect(state).toMatchObject({
      city: "newmarket",
      cat: ["cafes"],
      cost: ["free"],
      q: "market",
      view: "map",
      sort: "relevance",
      page: 1,
      picks: false,
    });
  });

  it("drops unknown values instead of failing", () => {
    const state = loadExploreState("?cat=cafes,nope&cost=cheap&sort=random&view=globe");
    expect(state.cat).toEqual(["cafes"]);
    expect(state.cost).toEqual([]);
    expect(state.sort).toBe("relevance");
    expect(state.view).toBe("list");
  });

  it("supports several values per filter", () => {
    expect(loadExploreState("?cost=free,low").cost).toEqual(["free", "low"]);
  });

  it("clamps the page and trims the query", () => {
    const state = normalizeExploreState(loadExploreState("?page=9999&q=%20%20market%20"));
    expect(state.page).toBe(50);
    expect(state.q).toBe("market");
    expect(normalizeExploreState(loadExploreState("?page=-3")).page).toBe(1);
  });

  it("round-trips through exploreHref and leaves defaults out", () => {
    expect(exploreHref()).toBe("/explore");
    const href = exploreHref({
      city: "waterloo",
      cat: ["arts", "cafes"],
      cost: ["free"],
      sort: "relevance",
    });
    expect(href).toBe("/explore?city=waterloo&cat=arts,cafes&cost=free");
    const back = loadExploreState(href.slice("/explore".length));
    expect(back.cat).toEqual(["arts", "cafes"]);
  });

  it("accepts only sensible map bounds", () => {
    const ok = normalizeExploreState(loadExploreState("?bbox=-79.6,43.9,-79.3,44.1"));
    expect(ok.bbox).toEqual([-79.6, 43.9, -79.3, 44.1]);
    for (const bad of ["?bbox=1,2,3", "?bbox=-79,44,-80,43", "?bbox=a,b,c,d", "?bbox=0,-95,1,1"]) {
      expect(normalizeExploreState(loadExploreState(bad)).bbox).toBeNull();
    }
  });

  it("counts active filters", () => {
    expect(activeFilterCount(loadExploreState("?city=x"))).toBe(0);
    expect(activeFilterCount(loadExploreState("?cost=free,low&picks=true&q=hi"))).toBe(4);
  });
});
