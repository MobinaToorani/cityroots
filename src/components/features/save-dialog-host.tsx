"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { SAVE_EVENT, type SaveRequest } from "./save-button";

// Loaded on the first save, so pages that never save pay nothing for it.
const SaveDialog = dynamic(() => import("./save-dialog").then((m) => m.SaveDialog), {
  ssr: false,
});

/** Mounted once in the root layout. Listens for save requests from any page. */
export function SaveDialogHost() {
  const [request, setRequest] = useState<
    (SaveRequest & { opener: HTMLElement | null; nonce: number }) | null
  >(null);
  useEffect(() => {
    function onSave(e: Event) {
      const detail = (e as CustomEvent<SaveRequest>).detail;
      const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setRequest((prev) => ({ ...detail, opener, nonce: (prev?.nonce ?? 0) + 1 }));
    }
    window.addEventListener(SAVE_EVENT, onSave);
    return () => window.removeEventListener(SAVE_EVENT, onSave);
  }, []);
  if (!request) return null;
  return (
    <SaveDialog
      key={`${request.placeId}:${request.nonce}`}
      placeId={request.placeId}
      placeName={request.placeName}
      onClose={() => {
        request.opener?.focus();
        setRequest(null);
      }}
    />
  );
}
