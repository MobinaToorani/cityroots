"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export const SAVE_EVENT = "cityroots:save";
export const SAVED_EVENT = "cityroots:saved";

export type SaveRequest = { placeId: string; placeName: string };
export type SavedChange = { placeId: string; saved: boolean };

/**
 * Opens the save dialog. A real link to the save page, so it still works
 * without JavaScript and for people who are not signed in yet.
 */
export function SaveButton({
  placeId,
  placeName,
  variant = "icon",
  className,
}: SaveRequest & { variant?: "icon" | "full"; className?: string }) {
  const [saved, setSaved] = useState<boolean | null>(null);

  useEffect(() => {
    function onSaved(e: Event) {
      const detail = (e as CustomEvent<SavedChange>).detail;
      if (detail.placeId === placeId) setSaved(detail.saved);
    }
    window.addEventListener(SAVED_EVENT, onSaved);
    return () => window.removeEventListener(SAVED_EVENT, onSaved);
  }, [placeId]);

  const label = saved ? "Saved" : "Save this place";
  return (
    <Link
      href={`/collections/save?place=${placeId}`}
      prefetch={false}
      aria-haspopup="dialog"
      aria-label={variant === "icon" ? `${saved ? "Saved" : "Save"}: ${placeName}` : undefined}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent<SaveRequest>(SAVE_EVENT, { detail: { placeId, placeName } }),
        );
      }}
      className={cn(
        "motion-press relative z-10 inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200",
        variant === "icon"
          ? "size-9 text-text-muted hover:bg-divider/60 hover:text-text"
          : "h-11 border border-divider bg-surface-solid/70 px-5 text-body hover:bg-surface-strong",
        saved && "text-primary-text",
        className,
      )}
    >
      <Icon icon={saved ? BookmarkCheck : Bookmark} size={variant === "icon" ? 20 : 16} />
      {variant === "full" && label}
    </Link>
  );
}
