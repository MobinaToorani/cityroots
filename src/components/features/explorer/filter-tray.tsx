"use client";

import { Search, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { toggle, useExplorer } from "./explorer-state";
import { buttonClasses } from "@/components/ui/button";
import { chipClasses } from "@/components/ui/chip";
import { FilterDropdown, FilterMenuFooter, FilterOption } from "@/components/ui/filter-dropdown";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { CATEGORIES } from "@/lib/domain/categories";
import { COST_BANDS, COST_HINTS, COST_LABELS } from "@/lib/domain/cost";
import { activeFilterCount, exploreHref, type ExploreState } from "@/lib/domain/explore-params";

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
 * Search, the two questions people ask most as one-tap toggles, and menus for
 * the rest. The city lives in the site header. Every option is a real link to
 * its URL, so it works without JavaScript; with JavaScript a click updates
 * state optimistically.
 */
export function FilterTray({ total }: { total: number }) {
  const { state, update, isPending } = useExplorer();
  const filters = activeFilterCount(state);
  const freeOnly = state.cost.length === 1 && state.cost[0] === "free";

  function option(patch: Partial<ExploreState>) {
    return {
      href: exploreHref({ ...state, page: 1, place: null, ...patch }),
      onSelect: () => void update(patch),
    };
  }

  /**
   * An open menu covers the results on a phone, so its foot says what the choice
   * did and closes the menu. Without JavaScript each choice reloads and closes it.
   */
  function menuFooter(clearPatch: Partial<ExploreState>, clearLabel: string, canClear: boolean) {
    const clear = option(clearPatch);
    return (
      <FilterMenuFooter>
        {canClear ? (
          <Link
            href={clear.href}
            scroll={false}
            onClick={inPlace(clear.onSelect)}
            className="flex min-h-11 items-center px-2 text-meta font-semibold text-text-muted quiet-link"
          >
            {clearLabel}
          </Link>
        ) : (
          <span />
        )}
        <Link
          href={exploreHref(state)}
          scroll={false}
          onClick={(e) => {
            e.preventDefault();
            const menu = e.currentTarget.closest("details");
            if (menu) menu.open = false;
            menu?.querySelector("summary")?.focus();
          }}
          className={buttonClasses("primary", "sm")}
        >
          {isPending ? "Updating" : `Show ${total} ${total === 1 ? "place" : "places"}`}
        </Link>
      </FilterMenuFooter>
    );
  }

  return (
    <div className="grid gap-3">
      <SearchBox />
      <div role="group" aria-label="Filters" className="relative flex flex-wrap items-center gap-2">
        <Toggle active={freeOnly} {...option({ cost: freeOnly ? [] : ["free"] })}>
          Free
        </Toggle>
        <Toggle active={state.open} {...option({ open: !state.open })}>
          <span
            aria-hidden="true"
            className={cn("size-2 rounded-full", state.open ? "bg-on-ink" : "bg-free")}
          />
          Open now
        </Toggle>

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
              category={c.slug}
              selected={state.cat.includes(c.slug)}
              {...option({ cat: toggle(state.cat, c.slug) })}
            >
              {c.name}
            </FilterOption>
          ))}
          {menuFooter({ cat: [] }, "Clear categories", state.cat.length > 0)}
        </FilterDropdown>

        <FilterDropdown
          name={MENU_GROUP}
          label="Budget"
          // The Free toggle already shows that choice, so one tap does not light up two controls.
          summary={<Summary label="Budget" count={freeOnly ? 0 : state.cost.length} />}
          active={state.cost.length > 0 && !freeOnly}
        >
          {COST_BANDS.map((band) => (
            <FilterOption
              key={band}
              mode="multi"
              selected={state.cost.includes(band)}
              {...option({ cost: toggle(state.cost, band) })}
            >
              {COST_LABELS[band]}
              <span className="ml-2 text-meta font-normal text-text-muted">{COST_HINTS[band]}</span>
            </FilterOption>
          ))}
          {menuFooter({ cost: [] }, "Clear budget", state.cost.length > 0)}
        </FilterDropdown>

        <Toggle active={state.picks} {...option({ picks: !state.picks })}>
          Local picks
        </Toggle>

        {filters > 0 && (
          <Link
            href={exploreHref({ city: state.city, view: state.view })}
            onClick={inPlace(
              () => void update({ cat: [], cost: [], type: [], picks: false, open: false, q: "" }),
            )}
            scroll={false}
            className="inline-flex h-9 items-center gap-1 px-2 text-meta font-semibold text-primary-text quiet-link"
          >
            <Icon icon={X} size={16} />
            Clear filters
            <span className="sr-only"> ({filters} active)</span>
          </Link>
        )}
      </div>
    </div>
  );
}

/** A one-tap filter. A link, so it works without JavaScript and can be shared. */
function Toggle({
  active,
  href,
  onSelect,
  children,
}: {
  active: boolean;
  href: Route;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={inPlace(onSelect)}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={chipClasses(active)}
    >
      {children}
    </Link>
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

  // Follow outside changes, such as "Clear filters".
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
        placeholder="Try pool, jazz, or market"
        autoComplete="off"
        enterKeyHint="search"
        className="h-12 w-0 min-w-0 flex-1 rounded-control border border-divider bg-surface-solid pr-4 pl-11 text-body outline-none placeholder:text-text-muted hover:border-text-muted focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus"
      />
    </form>
  );
}
