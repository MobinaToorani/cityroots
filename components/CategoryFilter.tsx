"use client";

import { Category } from "@/lib/types";
import { CATEGORIES } from "@/data/categories";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/CategoryIcon";

interface CategoryFilterProps {
  value: Category | "all";
  onChange: (value: Category | "all") => void;
  counts?: Partial<Record<Category | "all", number>>;
}

export function CategoryFilter({ value, onChange, counts }: CategoryFilterProps) {
  const allCount = counts?.all ?? 0;

  return (
    <div className="relative">
      {/* fade-out affordance indicating pills scroll right */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[#F7F4EF] dark:from-[#0F0E0C] to-transparent z-10" aria-hidden />
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      role="group"
      aria-label="Filter by category"
    >
      {/* All pill */}
      <button
        onClick={() => onChange("all")}
        aria-pressed={value === "all"}
        className={cn(
          "shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-all border",
          value === "all"
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400"
        )}
      >
        All
        {allCount > 0 && (
          <span className="ml-1.5 text-xs opacity-70">({allCount})</span>
        )}
      </button>

      {/* Category pills */}
      {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(
        ([key, cat]) => {
          const isActive = value === key;
          const count = counts?.[key] ?? 0;
          const hasResults = count > 0 || isActive;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              aria-pressed={isActive}
              disabled={!hasResults && !isActive}
              className={cn(
                "shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5",
                isActive
                  ? cn(cat.bgClass, cat.textClass, "border-transparent")
                  : hasResults
                  ? "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400"
                  : "bg-white text-zinc-300 border-zinc-200 cursor-not-allowed"
              )}
            >
              <CategoryIcon category={key} className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{cat.shortLabel}</span>
              {count > 0 && (
                <span className="text-xs opacity-70">({count})</span>
              )}
            </button>
          );
        }
      )}
    </div>
    </div>
  );
}
