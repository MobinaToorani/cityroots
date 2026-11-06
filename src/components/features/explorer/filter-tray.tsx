"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { toggle, useExplorer } from "./explorer-state";
import { chipClasses } from "@/components/ui/chip";
import { FilterDropdown, FilterMenuFooter, FilterOption } from "@/components/ui/filter-dropdown";
import { Icon } from "@/components/ui/icon";
import { CATEGORIES } from "@/lib/domain/categories";
import { COST_BANDS, COST_LABELS } from "@/lib/domain/cost";
import {
  activeFilterCount,
  exploreHref,
  PLACE_KINDS,
  type ExploreState,
} from "@/lib/domain/explore-params";

export const KIND_LABELS: Record<(typeof PLACE_KINDS)[number], string> = {
  place: "Places",
  event: "Events",
  program: "Programs",
  resource: "Resources",
};

type FilterTrayProps = { cities: { slug: string; name: string }[] };

/** Plain clicks update in place; modified clicks (new tab, and so on) follow the link. */
function inPlace(run: () => void) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    run();
  };
}

/** Only one filter menu is open at a time. */
const MENU_GROUP = "explore-filters";

/**
 * Search plus one row of compact filter menus. Every option is a real link to
 * its URL, so it works without JavaScript; with JavaScript a click updates
 * state optimistically.
 */
export function FilterTray({ cities }: FilterTrayProps) {
  const { state, update } = useExplorer();
  const filters = activeFilterCount(state);
  const cityName = cities.find((c) => c.slug === state.city)?.name;

  function option(patch: Partial<ExploreState>) {
    return {
      href: exploreHref({ ...state, page: 1, place: null, ...patch }),
      onSelect: () => void update(patch),
    };
  }

  function clearLink(patch: Partial<ExploreState>, label: string) {
    const { href, onSelect } = option(patch);
    return (
      <FilterMenuFooter>
        <Link
          href={href}
          scroll={false}
          onClick={inPlace(onSelect)}
          className="flex min-h-11 items-center px-2 text-meta font-semibold text-primary-text quiet-link"
        >
          {label}
        </Link>
      </FilterMenuFooter>
    );
  }

  return (
    <div className="grid gap-3">
      <SearchBox />
      <div role="group" aria-label="Filters" className="relative flex flex-wrap items-center gap-2">
        <FilterDropdown
          name={MENU_GROUP}
          label="City"
          summary={cityName ?? "All cities"}
          active={Boolean(state.city)}
        >
          <FilterOption mode="single" selected={!state.city} {...option({ city: null })}>
            All cities
          </FilterOption>
          {cities.map((c) => (
            <FilterOption
              key={c.slug}
              mode="single"
              selected={state.city === c.slug}
              {...option({ city: c.slug })}
            >
              {c.name}
            </FilterOption>
          ))}
        </FilterDropdown>

        <FilterDropdown
          name={MENU_GROUP}
          label="Cost"
          summary={<Summary label="Cost" count={state.cost.length} />}
          active={state.cost.length > 0}
        >
          {COST_BANDS.map((band) => (
            <FilterOption
              key={band}
              mode="multi"
              selected={state.cost.includes(band)}
              {...option({ cost: toggle(state.cost, band) })}
            >
              {COST_LABELS[band]}
            </FilterOption>
          ))}
          {state.cost.length > 0 && clearLink({ cost: [] }, "Clear cost")}
        </FilterDropdown>

        <FilterDropdown
          name={MENU_GROUP}
          label="Type"
          summary={<Summary label="Type" count={state.type.length} />}
          active={state.type.length > 0}
        >
          {PLACE_KINDS.map((kind) => (
            <FilterOption
              key={kind}
              mode="multi"
              selected={state.type.includes(kind)}
              {...option({ type: toggle(state.type, kind) })}
            >
              {KIND_LABELS[kind]}
            </FilterOption>
          ))}
          {state.type.length > 0 && clearLink({ type: [] }, "Clear type")}
        </FilterDropdown>

        <FilterDropdown
          name={MENU_GROUP}
          label="Category"
          summary={<Summary label="Category" count={state.cat.length} />}
          active={state.cat.length > 0}
        >
          {CATEGORIES.map((c) => (
            <FilterOption
              key={c.slug}
              mode="multi"
              accent={c.accent}
              selected={state.cat.includes(c.slug)}
              {...option({ cat: toggle(state.cat, c.slug) })}
            >
              {c.name}
            </FilterOption>
          ))}
          {state.cat.length > 0 && clearLink({ cat: [] }, "Clear categories")}
        </FilterDropdown>

        <Link
          href={option({ picks: !state.picks }).href}
          onClick={inPlace(option({ picks: !state.picks }).onSelect)}
          scroll={false}
          aria-current={state.picks ? "true" : undefined}
          className={chipClasses(state.picks)}
        >
          Picks only
        </Link>

        {filters > 0 && (
          <Link
            href={exploreHref({ city: state.city, view: state.view })}
            onClick={inPlace(
              () => void update({ cat: [], cost: [], type: [], picks: false, q: "" }),
            )}
            scroll={false}
            className="inline-flex h-9 items-center gap-1 px-2 text-meta font-semibold text-primary-text quiet-link"
          >
            <Icon icon={X} size={16} />
            Clear all
            <span className="sr-only"> filters ({filters} active)</span>
          </Link>
        )}
      </div>
    </div>
  );
}

/** Facet name plus how many options are on. Sits on the dark active button, so it is inverted. */
function Summary({ label, count }: { label: string; count: number }) {
  return (
    <>
      {label}
      {count > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-on-ink px-1.5 text-[11px] font-semibold text-ink">
          {count}
          <span className="sr-only"> selected</span>
        </span>
      )}
    </>
  );
}

/** Search as you type (debounced). Still a plain GET form without JavaScript. */
function SearchBox() {
  const { state, update } = useExplorer();
  const [value, setValue] = useState(state.q);
  const [lastQ, setLastQ] = useState(state.q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Follow outside changes, such as "Clear all".
  if (lastQ !== state.q) {
    setLastQ(state.q);
    setValue(state.q);
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function schedule(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void update({ q: next.trim() }), 300);
  }

  return (
    <form
      action="/explore"
      method="get"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        void update({ q: value.trim() });
      }}
      className="relative flex min-w-0 gap-2"
    >
      {state.city && <input type="hidden" name="city" value={state.city} />}
      <Icon
        icon={Search}
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-muted"
      />
      <label htmlFor="explore-q" className="sr-only">
        Search places
      </label>
      <input
        id="explore-q"
        name="q"
        type="search"
        value={value}
        onChange={(e) => schedule(e.target.value)}
        placeholder="Search name, area, or tag"
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 w-0 min-w-0 flex-1 rounded-full border border-divider bg-surface-solid pr-4 pl-11 text-body outline-none placeholder:text-text-muted hover:border-text-muted focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus"
      />
      <button
        type="submit"
        className="motion-press h-11 shrink-0 rounded-full bg-primary px-5 font-semibold text-white hover:bg-primary-hover active:translate-y-px"
      >
        Search
      </button>
    </form>
  );
}
