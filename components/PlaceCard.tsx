"use client";

import { useState } from "react";
import { ExternalLink, Star, MapPin, Leaf, Clock, Phone, ChevronRight, X, Check, CalendarCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Place } from "@/lib/types";
import { CATEGORIES, CATEGORY_CSS_VARS } from "@/data/categories";
import { cn } from "@/lib/utils";

interface PlaceCardProps {
  place: Place;
  variant?: "grid" | "list" | "map-popup";
}

const costStyles: Record<string, string> = {
  free: "bg-green-50 text-green-700 border-green-200",
  low: "bg-sky-50 text-sky-700 border-sky-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  varies: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

const costLabels: Record<string, string> = {
  free: "Free",
  low: "Low Cost",
  moderate: "Moderate",
  varies: "Varies",
};

function CostBadge({ cost, className }: { cost: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium gap-1 capitalize", costStyles[cost], className)}
    >
      {cost === "free" && <Leaf className="w-3 h-3" />}
      {costLabels[cost] ?? cost}
    </Badge>
  );
}

function PlaceDetailDrawer({ place, open, onClose }: { place: Place; open: boolean; onClose: () => void }) {
  const category = CATEGORIES[place.category];

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="border-b border-zinc-100 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg" aria-hidden>{category.emoji}</span>
                <span className={cn("text-xs font-medium uppercase tracking-wide", category.textClass)}>
                  {category.label}
                </span>
                <CostBadge cost={place.cost} />
              </div>
              <DrawerTitle className="text-xl font-semibold text-zinc-900 leading-snug">
                {place.name}
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                Details for {place.name}
              </DrawerDescription>
              {place.neighborhood && (
                <p className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {place.neighborhood}
                  {place.address && `, ${place.address}`}
                </p>
              )}
            </div>
            <DrawerClose
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-8 pt-4 space-y-6">
          <p className="text-zinc-700 text-sm leading-relaxed">{place.description}</p>

          {place.why && (
            <div className="bg-brand-light rounded-xl p-4 border border-green-100">
              <p className="text-sm font-medium text-brand mb-1">Why it&apos;s worth it</p>
              <p className="text-sm text-zinc-700 italic">&ldquo;{place.why}&rdquo;</p>
            </div>
          )}

          {place.highlights.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-3">Highlights</h4>
              <ul className="space-y-2">
                {place.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-700">
                    <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            {place.hours && (
              <p className="text-sm text-zinc-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                {place.hours}
              </p>
            )}
            {place.phone && (
              <p className="text-sm text-zinc-600 flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                <a href={`tel:${place.phone}`} className="hover:text-zinc-900 transition-colors">
                  {place.phone}
                </a>
              </p>
            )}
            {place.costNote && (
              <p className="text-xs text-zinc-500 bg-zinc-50 rounded-lg px-3 py-2">
                {place.costNote}
              </p>
            )}
            {place.seasonal && place.seasonNote && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                Seasonal: {place.seasonNote}
              </p>
            )}
          </div>

          {place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {place.website && (
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors"
            >
              {place.type === "event" ? "Event Details" :
               place.type === "program" ? "Program Info" :
               place.type === "resource" ? "View Resource" :
               "Visit Website"}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {place.lastVerified && (
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" />
              Verified{" "}
              {new Date(place.lastVerified).toLocaleDateString("en-CA", {
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function PlaceCard({ place, variant = "grid" }: PlaceCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const category = CATEGORIES[place.category];

  if (variant === "map-popup") {
    return (
      <>
        <div className="min-w-[200px]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm" aria-hidden>{category.emoji}</span>
            <CostBadge cost={place.cost} className="text-[11px] py-0" />
          </div>
          <p className="font-semibold text-sm text-zinc-900 leading-snug mb-1">{place.name}</p>
          {place.neighborhood && (
            <p className="text-xs text-zinc-500">{place.neighborhood}</p>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            className="mt-2 text-xs text-brand font-medium hover:underline flex items-center gap-1"
          >
            View Details <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <PlaceDetailDrawer place={place} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </>
    );
  }

  if (variant === "list") {
    return (
      <>
        <article
          onClick={() => setDrawerOpen(true)}
          className="group flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-xl cursor-pointer hover:border-zinc-300 hover:shadow-sm transition-all duration-150"
          aria-label={`View details for ${place.name}`}
        >
          <span className="text-xl shrink-0" aria-hidden>{category.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="font-semibold text-zinc-900 text-sm leading-snug">{place.name}</h3>
              {place.isRecommended && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                  <Star className="w-2.5 h-2.5 fill-amber-500" />
                  Pick
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 line-clamp-1">{place.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CostBadge cost={place.cost} />
            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
          </div>
        </article>
        <PlaceDetailDrawer place={place} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </>
    );
  }

  // Grid variant
  return (
    <>
      <article
        onClick={() => setDrawerOpen(true)}
        className="group bg-white border border-zinc-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-150 hover:border-zinc-300 hover:shadow-md flex flex-col"
        aria-label={`View details for ${place.name}`}
      >
        {/* Category color bar */}
        <div
          className="h-[3px] w-full shrink-0"
          style={{ background: CATEGORY_CSS_VARS[place.category] }}
          aria-hidden
        />
        <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Category row + Pick badge in same flex row — avoids absolute positioning overlap */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base shrink-0" aria-hidden>{category.emoji}</span>
            <span className={cn("text-xs font-medium uppercase tracking-wide truncate", category.textClass)}>
              {category.shortLabel}
            </span>
          </div>
          {place.isRecommended && (
            <Badge className="bg-amber-50 text-amber-700 border border-amber-100 text-xs gap-1 font-medium shrink-0">
              <Star className="w-3 h-3 fill-amber-400" />
              Pick
            </Badge>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-zinc-900 text-base leading-snug">
            {place.name}
          </h3>
          {place.neighborhood && (
            <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {place.neighborhood}
            </p>
          )}
        </div>

        {place.seasonal && place.seasonNote && (
          <p className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full w-fit border border-amber-100">
            {place.seasonNote}
          </p>
        )}

        <p className="text-sm text-zinc-600 line-clamp-2 flex-1 leading-relaxed">{place.description}</p>

        {place.tags.slice(0, 3).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {place.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-zinc-50 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-100"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
          <CostBadge cost={place.cost} />
          {place.website && (
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1 transition-colors"
            >
              Visit <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        </div>
      </article>

      <PlaceDetailDrawer place={place} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
