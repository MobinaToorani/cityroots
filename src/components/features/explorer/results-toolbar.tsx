"use client";

import { useExplorer } from "./explorer-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { exploreHref } from "@/lib/domain/explore-params";
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

export function ResultsToolbar({ total }: { total: number }) {
  const { state, update } = useExplorer();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-body" role="status" aria-live="polite">
        <span className="font-semibold">{total}</span> {total === 1 ? "result" : "results"}
        {state.q && (
          <>
            {" "}
            for <span className="font-semibold">&ldquo;{state.q}&rdquo;</span>
          </>
        )}
        {state.bbox && <span className="text-text-muted"> in this map area</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        <SegmentedControl
          label="Sort results"
          options={SORT_OPTIONS}
          value={state.sort}
          hrefFor={(sort) => exploreHref({ ...state, sort, page: 1, place: null })}
          onChange={(sort) => void update({ sort })}
        />
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
