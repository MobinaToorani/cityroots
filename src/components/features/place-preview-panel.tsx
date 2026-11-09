"use client";

import { ArrowRight, Clock, ExternalLink, MapPin, Navigation, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CostBadge, PickBadge } from "@/components/ui/badges";
import { buttonClasses } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { closePlacePreview, loadPlacePreview } from "@/lib/client/place-preview";
import type { PlacePreview } from "@/lib/data/types";
import { categoryMeta } from "@/lib/domain/categories";
import { costNote } from "@/lib/domain/cost";
import { mapsUrl } from "@/lib/domain/maps";
import { logger } from "@/lib/logger";
import { OpenNow } from "./open-now";
import { SaveButton } from "./save-button";
import { ShareButton } from "./share-button";
import { iconButtonClasses } from "@/components/ui/button";

/** Enough to decide on a place without leaving the list. A sheet on phones, a side panel above. */
export function PlacePreviewPanel({ placeId }: { placeId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [place, setPlace] = useState<PlacePreview | null>(null);
  const [failed, setFailed] = useState(false);

  // A layout effect, so Back closes the dialog while it is still in the page
  // and focus returns to the card that opened it.
  useLayoutEffect(() => {
    const el = dialog.current;
    el?.showModal();
    // Hold the list still behind the panel, and keep it from jumping sideways
    // when its scrollbar goes away.
    const { style } = document.documentElement;
    style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    style.overflow = "hidden";
    return () => {
      el?.close();
      style.removeProperty("overflow");
      style.removeProperty("padding-right");
    };
  }, []);

  useEffect(() => {
    let live = true;
    loadPlacePreview(placeId)
      .then((p) => {
        if (live) setPlace(p);
      })
      .catch((error: unknown) => {
        logger.warn("Could not load the place preview", { error });
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [placeId]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-busy={!place && !failed}
      onClose={() => {
        // The effect's cleanup closes it too, and that is not the visitor closing it.
        if (dialog.current && !dialog.current.open) closePlacePreview();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current.close();
      }}
      className="place-preview overflow-hidden bg-surface-solid p-0 text-text shadow-[var(--shadow-lift)] backdrop:bg-black/40"
    >
      <div className="flex h-full max-h-[inherit] flex-col">
        <div className="flex items-start gap-3 p-5 pb-3">
          <div className="min-w-0 flex-1">
            {place && (
              <p className="flex items-center gap-1.5 text-meta text-text-muted">
                <CategoryIcon slug={place.category} size={16} />
                {categoryMeta(place.category).name}
                {place.neighborhood ? `, ${place.neighborhood}` : ""}
              </p>
            )}
            <h2 id={titleId} className="mt-1 font-display text-section font-medium tracking-tight">
              {place?.name ?? (failed ? "This did not load" : "Loading")}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close"
            className={iconButtonClasses("-mt-1 -mr-1")}
          >
            <Icon icon={X} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          {place ? (
            <Details place={place} />
          ) : failed ? (
            <p className="text-body text-text-muted">It may have been taken down.</p>
          ) : (
            <div aria-hidden="true" className="grid gap-3 pt-1">
              <div className="h-7 w-2/5 rounded-control bg-divider/60" />
              <div className="h-11 rounded-control bg-divider/60" />
              <div className="h-24 rounded-card bg-divider/40" />
            </div>
          )}
        </div>

        {!failed && (
          <div className="border-t border-divider p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Link
              href={`/places/${placeId}`}
              prefetch={false}
              className="motion-press flex h-11 items-center justify-center gap-1.5 rounded-control font-semibold text-primary-text transition-colors hover:bg-sand/60"
            >
              See full details
              <Icon icon={ArrowRight} size={16} />
            </Link>
          </div>
        )}
      </div>
    </dialog>
  );
}

function Details({ place }: { place: PlacePreview }) {
  const hasMap = Boolean(place.lat && place.lng);
  const price = costNote(place.costBand, place.priceNote);
  // Directions and Website share a row, or the one there is takes all of it.
  const wide = hasMap && place.sourceUrl ? "" : "col-span-2";
  return (
    <div className="grid gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <CostBadge band={place.costBand} className="text-body" />
          {place.isPick && <PickBadge />}
        </div>
        {price && <p className="mt-1.5 text-body text-text-muted">{price}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {hasMap && (
          <a
            href={mapsUrl(place)}
            target="_blank"
            rel="noopener"
            className={cn(buttonClasses("primary"), wide)}
          >
            <Icon icon={Navigation} size={16} />
            Directions
          </a>
        )}
        {place.sourceUrl && (
          <a
            href={place.sourceUrl}
            target="_blank"
            rel="noopener"
            className={cn(buttonClasses(hasMap ? "secondary" : "primary"), wide)}
          >
            Website
            <Icon icon={ExternalLink} size={16} />
          </a>
        )}
        <SaveButton placeId={place.id} placeName={place.name} variant="full" />
        <ShareButton title={place.name} path={`/places/${place.id}`} />
      </div>

      <p className="text-body">{place.description}</p>

      {place.curatorNote && (
        <p className="rounded-card bg-bg p-4 text-body">
          <span className="block text-meta font-semibold text-text-muted">Why go</span>
          {place.curatorNote}
        </p>
      )}

      <div className="grid gap-3">
        {place.hours && (
          <Row icon={Clock}>
            {place.hours.weekly && <OpenNow weekly={place.hours.weekly} />}
            {place.hours.text}
          </Row>
        )}
        {place.address && <Row icon={MapPin}>{place.address}</Row>}
        {place.phone && (
          <Row icon={Phone}>
            <a href={`tel:${place.phone.replace(/[^\d+]/g, "")}`} className="quiet-link">
              {place.phone}
            </a>
          </Row>
        )}
      </div>
    </div>
  );
}

function Row({ icon, children }: { icon: typeof MapPin; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[20px_1fr] gap-3 text-body">
      <Icon icon={icon} className="mt-0.5 text-text-muted" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
