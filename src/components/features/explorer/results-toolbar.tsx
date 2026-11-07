"use client";

import { Dices } from "lucide-react";
import { useExplorer } from "./explorer-state";
import { chipClasses } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { FilterDropdown, FilterOption } from "@/components/ui/filter-dropdown";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { exploreHref, type ExploreState } from "@/lib/domain/explore-params";
import type { Sort } from "@/lib/domain/ranking";

const SORT_OPTIONS = [
  { value: "relevance", label: "Best match" },
  { value: "cost", label: "Lowest cost" },
  { value: "newest", label: "Newest" },
] as const satisfies readonly { value: Sort; label: string }[];

const VIEW_OPTIONS = [
  { value: "list", label: "List" },
  { value: "map", label: "Map" },
] as const;

/** The current filters, so a surprise respects them. */
function surpriseQuery(state: ExploreState): string {
  const href = exploreHref({ ...state, page: 1, place: null, bbox: null, view: "list" });
  return href.slice("/explore".length);
}

/** A random place that fits the current filters. Above the list on desktop, below it on phones. */
export function SurpriseLink() {
  const { state } = useExplorer();
  return (
    <a href={`/explore/surprise${surpriseQuery(state)}`} className={chipClasses(false)}>
      <Icon icon={Dices} size={16} />
      Surprise me
    </a>
  );
}

export function ResultsToolbar({ total }: { total: number }) {
  const { state, update } = useExplorer();
  // With nothing searched there is nothing to match, so say what the order really is.
  const options = SORT_OPTIONS.map((o) =>
    o.value === "relevance" && !state.q ? { ...o, label: "Free first" } : o,
  );
  const sortLabel = options.find((o) => o.value === state.sort)?.label ?? options[0]?.label;
  return (
    // Positioned, so the sort menu spans this row on phones.
    <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
      <p className="text-body" role="status" aria-live="polite">
        <span className="font-semibold">{total}</span> {total === 1 ? "place" : "places"}
        {state.q && (
          <>
            {" "}
            for <span className="font-semibold">&ldquo;{state.q}&rdquo;</span>
          </>
        )}
        {state.bbox && <span className="text-text-muted"> in this map area</span>}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {total > 1 && (
          <div className="hidden sm:block">
            <SurpriseLink />
          </div>
        )}
        {total > 1 && (
          <FilterDropdown
            label="Sort results"
            summary={
              <>
                <span className="sr-only text-text-muted sm:not-sr-only">Sort:</span> {sortLabel}
              </>
            }
            align="end"
          >
            {options.map((o) => (
              <FilterOption
                key={o.value}
                mode="single"
                selected={state.sort === o.value}
                href={exploreHref({ ...state, sort: o.value, page: 1, place: null })}
                onSelect={() => void update({ sort: o.value })}
              >
                {o.label}
              </FilterOption>
            ))}
          </FilterDropdown>
        )}
        <SegmentedControl
          label="View"
          options={VIEW_OPTIONS}
          value={state.view}
          hrefFor={(view) => exploreHref({ ...state, view, page: 1, place: null, bbox: null })}
          onChange={(view) => void update({ view, bbox: view === "list" ? null : state.bbox })}
        />
      </div>
    </div>
  );
}
