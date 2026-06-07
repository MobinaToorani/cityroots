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
    <div className="flex items-center gap-2 flex-wrap">
      {activeChips.map((chip) => (
        <span
          key={chip.key}
          className="flex items-center gap-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium px-3 py-1.5 rounded-full"
        >
          {chip.label}
          <button
            onClick={() => onRemove(chip.key)}
            aria-label={`Remove ${chip.label} filter`}
            className="text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-zinc-500 hover:text-zinc-900 underline transition-colors ml-1"
      >
        Clear all
      </button>
    </div>
  );
}
