"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/components/ui/toaster";
import { savedPlaces, toggleSaved } from "@/lib/client/stores";
import { cn } from "@/lib/cn";
import { GOALS, track } from "@/lib/analytics";

type SaveButtonProps = {
  placeId: string;
  placeName: string;
  variant?: "icon" | "full";
  className?: string;
};

/** Saves on this device in one tap. No account, no dialog. */
export function SaveButton({ placeId, placeName, variant = "icon", className }: SaveButtonProps) {
  const saved = savedPlaces.use().includes(placeId);
  const [pop, setPop] = useState(0);

  function onClick() {
    const nowSaved = toggleSaved(placeId);
    if (nowSaved) {
      setPop((n) => n + 1);
      track(GOALS.placeSaved);
      toast("Saved", { label: "View saved", href: "/saved" });
    } else {
      toast("Removed", { label: "Undo", onClick: () => toggleSaved(placeId) });
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={variant === "icon" ? `Save ${placeName}` : undefined}
      className={cn(
        "motion-press relative z-10 inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200",
        variant === "icon"
          ? "size-10 text-text-muted hover:bg-bg hover:text-text"
          : "h-11 border border-divider bg-surface-solid px-5 text-body hover:border-text-muted/50",
        saved && "text-[#c2453f] hover:text-[#c2453f]",
        className,
      )}
    >
      <Icon
        key={pop}
        icon={Heart}
        size={20}
        fill={saved ? "currentColor" : "none"}
        className={pop > 0 ? "heart-pop" : undefined}
      />
      {variant === "full" && (saved ? "Saved" : "Save")}
    </button>
  );
}
