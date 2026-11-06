"use client";

import { ListPlus } from "lucide-react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export const SAVE_EVENT = "cityroots:add-to-collection";

export type SaveRequest = { placeId: string; placeName: string };

/**
 * Sorting into named lists, for people who want more than the heart. A real
 * link, so it works without JavaScript and for people not signed in yet.
 */
export function AddToCollection({ placeId, placeName }: SaveRequest) {
  return (
    <Link
      href={`/collections/save?place=${placeId}`}
      prefetch={false}
      aria-haspopup="dialog"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent<SaveRequest>(SAVE_EVENT, { detail: { placeId, placeName } }),
        );
      }}
      className="inline-flex items-center gap-1.5 text-meta font-semibold text-primary-text quiet-link"
    >
      <Icon icon={ListPlus} size={16} />
      Add to a collection
    </Link>
  );
}
