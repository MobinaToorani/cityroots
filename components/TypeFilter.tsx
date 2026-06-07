"use client";

import { PlaceType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS: { value: PlaceType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "place", label: "Places" },
  { value: "event", label: "Events" },
  { value: "program", label: "Programs" },
  { value: "resource", label: "Resources" },
];

interface TypeFilterProps {
  value: PlaceType | "all";
  onChange: (value: PlaceType | "all") => void;
  counts?: Partial<Record<PlaceType | "all", number>>;
}

export function TypeFilter({ value, onChange, counts }: TypeFilterProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      role="group"
      aria-label="Filter by type"
    >
      {TYPE_OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        const count = opt.value === "all" ? undefined : (counts?.[opt.value] ?? 0);
        const hasResults = opt.value === "all" || isActive || count === undefined || count > 0;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={isActive}
            disabled={!hasResults}
            className={cn(
              "shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-all border whitespace-nowrap",
              isActive
                ? "bg-zinc-900 text-white border-zinc-900"
                : hasResults
                ? "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400"
                : "bg-white text-zinc-300 border-zinc-200 cursor-not-allowed"
            )}
          >
            {opt.label}
            {count !== undefined && count > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
