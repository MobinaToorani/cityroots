"use client";

import { ArrowRight, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useExplorer } from "./explorer-state";
import { CategoryTag, CostBadge, PickBadge } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import type { MapPoint } from "@/lib/data/places";
import { validBbox } from "@/lib/domain/explore-params";

const ExplorerMap = dynamic(() => import("./explorer-map"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="grid h-full place-items-center bg-divider/40 text-meta text-text-muted"
    >
      Loading the map
    </div>
  ),
});

export function MapPane({ points }: { points: MapPoint[] }) {
  const { state, update, setShallow } = useExplorer();
  const selected = points.find((p) => p.id === state.place) ?? null;
  const free = points.filter((p) => p.costBand === "free").length;
  const cardLink = useRef<HTMLAnchorElement>(null);

  // Move focus to the card so keyboard and screen reader users land on it.
  useEffect(() => {
    if (selected) cardLink.current?.focus({ preventScroll: true });
  }, [selected]);

  return (
    <div className="relative h-full overflow-hidden lg:rounded-[var(--radius-modal)]">
      <a
        href="#results"
        className="sr-only z-20 rounded-full bg-ink px-4 py-2 font-semibold text-on-ink focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip the map, go to results
      </a>

      <ExplorerMap
        points={points}
        selectedId={state.place}
        initialBbox={validBbox(state.bbox)}
        onSelect={(id) => void setShallow({ place: id })}
        onBoundsChange={(bbox) => void update({ bbox })}
      />

      <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-2">
        <span className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-meta glass-strong">
          <span className="font-semibold">{points.length}</span> on the map,
          <span className="font-semibold text-free">{free} free</span>
        </span>
        {state.bbox && (
          <button
            type="button"
            onClick={() => void update({ bbox: null })}
            className="motion-press pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-meta font-semibold glass-strong active:translate-y-px"
          >
            <Icon icon={X} size={16} />
            Show results everywhere
          </button>
        )}
      </div>

      {selected && (
        <div
          key={selected.id}
          role="dialog"
          aria-label={selected.name}
          onKeyDown={(e) => {
            if (e.key === "Escape") void setShallow({ place: null });
          }}
          className="sheet-up absolute inset-x-3 bottom-[calc(10rem+env(safe-area-inset-bottom))] z-10 rounded-[var(--radius-card)] p-4 glass-strong lg:right-auto lg:bottom-3 lg:left-3 lg:w-[360px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryTag slug={selected.category} />
              {selected.isPick && <PickBadge />}
              <CostBadge band={selected.costBand} />
            </div>
            <button
              type="button"
              onClick={() => void setShallow({ place: null })}
              aria-label="Close place card"
              className="-m-1 grid size-8 shrink-0 place-items-center rounded-full hover:bg-divider/60"
            >
              <Icon icon={X} size={16} />
            </button>
          </div>
          <h2 className="mt-2 text-card font-semibold tracking-tight">{selected.name}</h2>
          <p className="mt-1 line-clamp-2 text-body text-text-muted">{selected.summary}</p>
          <Link
            ref={cardLink}
            href={`/places/${selected.id}`}
            className="mt-3 inline-flex items-center gap-1.5 font-semibold text-primary-text quiet-link"
          >
            View details
            <Icon icon={ArrowRight} size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
