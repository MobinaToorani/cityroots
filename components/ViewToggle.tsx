"use client";

import { LayoutGrid, List, Map } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list" | "map";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

const OPTIONS: { value: ViewMode; label: string; Icon: React.ElementType }[] = [
  { value: "grid", label: "Grid view", Icon: LayoutGrid },
  { value: "list", label: "List view", Icon: List },
  { value: "map", label: "Map view", Icon: Map },
];

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      className="flex items-center border border-[#E5DED4] dark:border-stone-700 rounded-xl overflow-hidden bg-white dark:bg-stone-900"
      role="group"
      aria-label="View mode"
    >
      {OPTIONS.map(({ value: v, label, Icon }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          aria-label={label}
          className={cn(
            "h-9 px-3 flex items-center gap-1.5 font-medium transition-all",
            value === v
              ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
              : "text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px] tracking-wide">{label.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}
