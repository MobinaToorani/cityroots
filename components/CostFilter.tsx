"use client";

import { CostLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CostFilterProps {
  value: CostLevel | "all";
  onChange: (value: CostLevel | "all") => void;
  counts?: Partial<Record<CostLevel | "all", number>>;
}

const COST_OPTIONS: {
  value: CostLevel | "all";
  label: string;
  dot?: string;
}[] = [
  { value: "all", label: "All Costs" },
  { value: "free", label: "Free", dot: "bg-green-500" },
  { value: "low", label: "Low Cost", dot: "bg-sky-500" },
  { value: "moderate", label: "Moderate", dot: "bg-amber-500" },
  { value: "varies", label: "Varies", dot: "bg-zinc-400" },
];

export function CostFilter({ value, onChange, counts }: CostFilterProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      role="group"
      aria-label="Filter by cost"
    >
      {COST_OPTIONS.map((opt) => {
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
              "shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-all border whitespace-nowrap flex items-center gap-2",
              isActive
                ? "bg-zinc-900 text-white border-zinc-900"
                : hasResults
                ? "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400"
                : "bg-white text-zinc-300 border-zinc-200 cursor-not-allowed"
            )}
          >
            {opt.dot && (
              <span
                className={cn("w-2 h-2 rounded-full shrink-0", opt.dot, isActive && "opacity-70")}
                aria-hidden
              />
            )}
            {opt.label}
            {count !== undefined && count > 0 && (
              <span className="text-xs opacity-70">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
