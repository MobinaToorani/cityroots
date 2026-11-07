"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { loadPlacePreview, openPlacePreview } from "@/lib/client/place-preview";

type PlaceLinkProps = Omit<ComponentProps<typeof Link>, "href" | "prefetch"> & { placeId: string };

/**
 * Opens the place in a panel over the current page. Still a real link to the
 * full page, for new tabs, search engines, and browsing without JavaScript.
 */
export function PlaceLink({ placeId, onClick, ...props }: PlaceLinkProps) {
  return (
    <Link
      {...props}
      href={`/places/${placeId}`}
      prefetch={false}
      aria-haspopup="dialog"
      onPointerEnter={() => {
        void import("./place-preview-panel");
        void loadPlacePreview(placeId).catch(() => undefined);
      }}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openPlacePreview(placeId);
      }}
    />
  );
}
