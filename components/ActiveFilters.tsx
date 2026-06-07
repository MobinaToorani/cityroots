"use client";

import { X } from "lucide-react";
import { FilterState } from "@/lib/types";
import { CATEGORIES } from "@/data/categories";

interface ActiveFiltersProps {
  filters: FilterState;
  onRemove: (key: keyof FilterState) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  const activeChips: { key: keyof FilterState; label: string }[] = [];

  if (filters.category !== "all") {
    activeChips.push({
      key: "category",
      label: CATEGORIES[filters.category]?.shortLabel ?? filters.category,
    });
  }
  if (filters.cost !== "all") {
    const labels: Record<string, string> = {
      free: "Free",
      low: "Low Cost",
      moderate: "Moderate",
      varies: "Varies",
    };
    activeChips.push({ key: "cost", label: labels[filters.cost] ?? filters.cost });
  }
  if (filters.type !== "all") {
    const labels: Record<string, string> = {
      place: "Places",
      event: "Events",
      program: "Programs",
      resource: "Resources",
    };
    activeChips.push({ key: "type", label: labels[filters.type] ?? filters.type });
  }
  if (filters.showRecommendedOnly) {
    activeChips.push({ key: "showRecommendedOnly", label: "Recommended only" });
  }

  if (activeChips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {activeChips.map((chip) => (
        <span
          key={chip.key}
          className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] font-medium px-2.5 py-1 rounded-full border border-stone-200 dark:border-stone-700"
        >
          {chip.label}
          <button
            onClick={() => onRemove(chip.key)}
            aria-label={`Remove ${chip.label} filter`}
            className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-[11px] text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors ml-0.5"
      >
        Clear all
      </button>
    </div>
  );
}
