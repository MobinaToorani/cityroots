import type { Route } from "next";
import {
  createLoader,
  createSerializer,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";
import { CATEGORY_SLUGS } from "./categories";
import { COST_BANDS } from "./cost";
import { SORTS } from "./ranking";

export const PLACE_KINDS = ["place", "event", "program", "resource"] as const;
export const VIEWS = ["list", "map"] as const;

/**
 * Explorer state lives entirely in the URL, for example
 * /explore?city=newmarket&cat=cafes&cost=free&q=market&view=map
 * The same parsers run on the server (first render, no-JS crawlers) and the client.
 */
export const exploreParsers = {
  city: parseAsString,
  cat: parseAsArrayOf(parseAsStringLiteral(CATEGORY_SLUGS)).withDefault([]),
  cost: parseAsArrayOf(parseAsStringLiteral(COST_BANDS)).withDefault([]),
  type: parseAsArrayOf(parseAsStringLiteral(PLACE_KINDS)).withDefault([]),
  q: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(SORTS).withDefault("relevance"),
  view: parseAsStringLiteral(VIEWS).withDefault("list"),
  picks: parseAsBoolean.withDefault(false),
  page: parseAsInteger.withDefault(1),
};

export type ExploreState = inferParserType<typeof exploreParsers>;

export const loadExploreState = createLoader(exploreParsers);

/** Builds /explore URLs. Default values are left out so links stay short. */
const serialize = createSerializer(exploreParsers, { clearOnDefault: true });

export function exploreHref(state: Partial<ExploreState> = {}): Route {
  // Always a valid /explore URL; only the query string varies.
  return `/explore${serialize(state)}` as Route;
}

export function normalizeExploreState(state: ExploreState): ExploreState {
  return {
    ...state,
    q: state.q.trim().slice(0, 120),
    page: Math.min(Math.max(1, state.page), 50),
    cat: [...new Set(state.cat)],
    cost: [...new Set(state.cost)],
    type: [...new Set(state.type)],
  };
}

export function activeFilterCount(state: ExploreState): number {
  return (
    state.cat.length +
    state.cost.length +
    state.type.length +
    (state.picks ? 1 : 0) +
    (state.q ? 1 : 0)
  );
}
