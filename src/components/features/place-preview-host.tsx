"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PREVIEW_PARAM } from "@/lib/client/place-preview";

// Loaded on first use, so pages where nobody opens a place pay nothing for it.
const PlacePreviewPanel = dynamic(
  () => import("./place-preview-panel").then((m) => m.PlacePreviewPanel),
  { ssr: false },
);

function Host() {
  const placeId = useSearchParams().get(PREVIEW_PARAM);
  return placeId ? <PlacePreviewPanel key={placeId} placeId={placeId} /> : null;
}

/** Mounted once per layout. The URL decides what is open, so Back and reload just work. */
export function PlacePreviewHost() {
  return (
    <Suspense fallback={null}>
      <Host />
    </Suspense>
  );
}
