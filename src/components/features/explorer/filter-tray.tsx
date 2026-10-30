"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { toggle, useExplorer } from "./explorer-state";
import { CountBadge } from "@/components/ui/badges";
import { chipClasses } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
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

/**
 * Floating glass filter tray. Every chip is a real link to its URL, so it works
 * without JavaScript; with JavaScript the click updates state optimistically.
 */
export function FilterTray({ cities }: FilterTrayProps) {
  const { state, update } = useExplorer();
  const filters = activeFilterCount(state);

  function chip(patch: Partial<ExploreState>, active: boolean, label: ReactNode, accent?: string) {
    const href = exploreHref({ ...state, page: 1, place: null, ...patch });
    const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      void update(patch);
    };
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? "true" : undefined}
        className={chipClasses(active)}
        scroll={false}
      >
        {accent && (
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{ backgroundColor: accent }}
          />
        )}
        {label}
      </Link>
    );
  }

  return (
    <GlassCard strength="strong" className="grid gap-3 p-3 sm:p-4">
      <SearchBox />
      <Row label="City">
        {chip({ city: null }, !state.city, "All cities")}
        {cities.map((c) => (
          <span key={c.slug} className="contents">
            {chip({ city: c.slug }, state.city === c.slug, c.name)}
          </span>
        ))}
      </Row>
      <Row label="Cost and type">
        {COST_BANDS.map((band) => (
          <span key={band} className="contents">
            {chip({ cost: toggle(state.cost, band) }, state.cost.includes(band), COST_LABELS[band])}
          </span>
        ))}
        <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 self-center bg-divider" />
        {PLACE_KINDS.map((kind) => (
          <span key={kind} className="contents">
            {chip({ type: toggle(state.type, kind) }, state.type.includes(kind), KIND_LABELS[kind])}
          </span>
        ))}
        {chip({ picks: !state.picks }, state.picks, "Picks only")}
      </Row>
      <Row label="Category">
        {CATEGORIES.map((c) => (
          <span key={c.slug} className="contents">
            {chip(
              { cat: toggle(state.cat, c.slug) },
              state.cat.includes(c.slug),
              c.shortName,
              c.accent,
            )}
          </span>
        ))}
      </Row>
      {filters > 0 && (
        <div className="flex">
          <Link
            href={exploreHref({ city: state.city, view: state.view })}
            onClick={(e) => {
              e.preventDefault();
              void update({ cat: [], cost: [], type: [], picks: false, q: "" });
            }}
            scroll={false}
            className={chipClasses(false, "gap-1.5")}
          >
            <Icon icon={X} size={16} />
            Clear all filters
            <CountBadge count={filters} label={`${filters} active`} />
          </Link>
        </div>
      )}
    </GlassCard>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-1 no-scrollbar flex gap-2 overflow-x-auto px-1 py-0.5"
    >
      {children}
    </div>
  );
}

/** Search as you type (debounced). Still a plain GET form without JavaScript. */
function SearchBox() {
  const { state, update } = useExplorer();
  const [value, setValue] = useState(state.q);
  const [lastQ, setLastQ] = useState(state.q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Follow outside changes, such as "Clear all filters".
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
      className="relative flex gap-2"
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
        placeholder="Search by name, neighborhood, or tag"
        autoComplete="off"
        className="h-11 min-w-0 flex-1 rounded-full border border-divider bg-surface-solid pr-4 pl-11 text-body outline-none placeholder:text-text-muted hover:border-text-muted focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus"
      />
      <button
        type="submit"
        className="motion-press h-11 rounded-full bg-primary px-5 font-semibold text-white hover:bg-primary-hover active:translate-y-px"
      >
        Search
      </button>
    </form>
  );
}
