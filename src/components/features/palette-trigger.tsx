"use client";

import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export const OPEN_EVENT = "cityroots:open-palette";

const CommandPalette = dynamic(() => import("./command-palette").then((m) => m.CommandPalette), {
  ssr: false,
});

/**
 * Opens the palette. A link to the explorer, so it still goes somewhere useful
 * without JavaScript.
 */
export function PaletteTrigger({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/explore"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        window.dispatchEvent(new Event(OPEN_EVENT));
      }}
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        "motion-press inline-flex h-10 items-center gap-2 rounded-control text-meta font-semibold text-text-muted hover:text-text",
        compact
          ? "w-10 justify-center hover:bg-divider/60"
          : "w-full border border-divider bg-surface-solid/60 px-3.5",
        className,
      )}
    >
      <Icon icon={Search} size={16} />
      <span className={compact ? "sr-only" : undefined}>Search</span>
      {!compact && (
        <kbd className="ml-auto hidden rounded-md border border-divider px-1.5 font-sans text-[0.75rem] lg:inline">
          Ctrl K
        </kbd>
      )}
    </Link>
  );
}

/** Loads the palette the first time someone asks for it, so other pages never pay for it. */
export function PaletteHost() {
  const [wanted, setWanted] = useState(false);
  useEffect(() => {
    if (wanted) return;
    const open = () => setWanted(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, open);
    };
  }, [wanted]);
  return wanted ? <CommandPalette /> : null;
}
