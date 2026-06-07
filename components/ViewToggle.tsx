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
    <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden bg-white" role="group" aria-label="View mode">
      {OPTIONS.map(({ value: v, label, Icon }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          aria-label={label}
          className={cn(
            "h-9 px-3 flex items-center gap-1.5 text-sm font-medium transition-colors",
            value === v
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-50"
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}
