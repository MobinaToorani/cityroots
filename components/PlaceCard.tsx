"use client";

import { useState } from "react";
import { ExternalLink, Star, MapPin, Leaf, Clock, Phone, ChevronRight, X, Check, CalendarCheck } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Place } from "@/lib/types";
import { CATEGORIES, CATEGORY_COLORS } from "@/data/categories";
import { cn } from "@/lib/utils";

interface PlaceCardProps {
  place: Place;
  variant?: "grid" | "list" | "map-popup";
}

const costConfig: Record<string, { label: string; classes: string; darkClasses: string; icon?: boolean }> = {
  free:     { label: "Free",      classes: "text-emerald-700 bg-emerald-50 border-emerald-100",     darkClasses: "dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900", icon: true },
  low:      { label: "Low Cost",  classes: "text-sky-700 bg-sky-50 border-sky-100",                 darkClasses: "dark:text-sky-400 dark:bg-sky-950/30 dark:border-sky-900" },
  moderate: { label: "Moderate",  classes: "text-amber-700 bg-amber-50 border-amber-100",           darkClasses: "dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900" },
  varies:   { label: "Varies",    classes: "text-stone-500 bg-stone-50 border-stone-100",           darkClasses: "dark:text-stone-400 dark:bg-stone-800 dark:border-stone-700" },
};

function CostBadge({ cost, className }: { cost: string; className?: string }) {
  const cfg = costConfig[cost] ?? costConfig.varies;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
      cfg.classes, cfg.darkClasses, className
    )}>
      {cfg.icon && <Leaf className="w-2.5 h-2.5" />}
      {cfg.label}
    </span>
  );
}

function PlaceDetailDrawer({ place, open, onClose }: { place: Place; open: boolean; onClose: () => void }) {
  const category = CATEGORIES[place.category];
  const color = CATEGORY_COLORS[place.category];

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[94vh] bg-white dark:bg-[#1B1916] border-[#E5DED4] dark:border-[#2E2A24]">
        {/* Color accent bar */}
        <div className="h-[2px] w-full shrink-0 rounded-t-2xl" style={{ background: color }} />

        <DrawerHeader className="px-6 pt-5 pb-4 border-b border-[#E5DED4]/50 dark:border-[#2E2A24]/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Category row */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg" aria-hidden>{category.emoji}</span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color }}
                >
                  {category.label}
                </span>
                <CostBadge cost={place.cost} />
              </div>

              <DrawerTitle className="text-[20px] font-semibold text-stone-900 dark:text-stone-50 leading-tight mb-1">
                {place.name}
              </DrawerTitle>
              <DrawerDescription className="sr-only">Details for {place.name}</DrawerDescription>

              {place.neighborhood && (
                <p className="text-[12px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {place.neighborhood}{place.address && `, ${place.address}`}
                </p>
              )}
            </div>
            <DrawerClose
              className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-300 dark:text-stone-600 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-6 pb-10 pt-5 space-y-6">
          <p className="text-[14px] text-stone-600 dark:text-stone-300 leading-relaxed">{place.description}</p>

          {place.why && (
            <div className="rounded-xl p-4 border" style={{ background: `${color}09`, borderColor: `${color}25` }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color }}>
                Why it&apos;s worth it
              </p>
              <p className="text-[13px] text-stone-600 dark:text-stone-300 italic leading-relaxed">
                &ldquo;{place.why}&rdquo;
              </p>
            </div>
          )}

          {place.highlights.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500 mb-3">
                Highlights
              </p>
              <ul className="space-y-2.5">
                {place.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-stone-600 dark:text-stone-300">
                    <Check className="w-3.5 h-3.5 text-brand dark:text-green-500 shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2.5">
            {place.hours && (
              <p className="text-[13px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 shrink-0" />
                {place.hours}
              </p>
            )}
            {place.phone && (
              <p className="text-[13px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 shrink-0" />
                <a href={`tel:${place.phone}`} className="hover:text-stone-800 dark:hover:text-stone-100 transition-colors">
                  {place.phone}
                </a>
              </p>
            )}
            {place.costNote && (
              <p className="text-[12px] text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 rounded-xl px-3.5 py-2.5 border border-stone-100 dark:border-stone-700">
                {place.costNote}
              </p>
            )}
            {place.seasonal && place.seasonNote && (
              <p className="text-[12px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3.5 py-2.5 border border-amber-100 dark:border-amber-900">
                Seasonal: {place.seasonNote}
              </p>
            )}
          </div>

          {place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] text-stone-400 dark:text-stone-500 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 px-2.5 py-1 rounded-full"
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
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-[13px] font-medium transition-colors"
              style={{ background: color, color: "#fff" }}
            >
              {place.type === "event" ? "Event Details" :
               place.type === "program" ? "Program Info" :
               place.type === "resource" ? "View Resource" :
               "Visit Website"}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {place.lastVerified && (
            <p className="text-[11px] text-stone-300 dark:text-stone-600 flex items-center gap-1.5">
              <CalendarCheck className="w-3 h-3" />
              Verified{" "}
              {new Date(place.lastVerified).toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
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
  const color = CATEGORY_COLORS[place.category];

  if (variant === "map-popup") {
    return (
      <>
        <div className="min-w-[200px]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm" aria-hidden>{category.emoji}</span>
            <CostBadge cost={place.cost} />
          </div>
          <p className="font-semibold text-[13px] text-stone-900 leading-snug mb-1">{place.name}</p>
          {place.neighborhood && (
            <p className="text-[11px] text-stone-400">{place.neighborhood}</p>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            className="mt-2 text-[12px] font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color }}
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
          className="group flex items-center gap-4 px-5 py-4 bg-white dark:bg-[#1B1916] border border-[#E5DED4] dark:border-[#2E2A24] rounded-2xl cursor-pointer hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all duration-200"
          aria-label={`View details for ${place.name}`}
        >
          {/* Category avatar */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}12` }}
          >
            <span className="text-[18px]" aria-hidden>{category.emoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[13px] font-semibold text-stone-800 dark:text-stone-100 leading-snug">{place.name}</h3>
              {place.isRecommended && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800 px-1.5 py-0.5 rounded-full">
                  <Star className="w-2.5 h-2.5 fill-amber-500 dark:fill-amber-400" />
                  Pick
                </span>
              )}
            </div>
            <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-0.5 line-clamp-1">{place.description}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <CostBadge cost={place.cost} />
            <ChevronRight className="w-3.5 h-3.5 text-stone-200 dark:text-stone-700 group-hover:text-stone-400 dark:group-hover:text-stone-500 transition-colors" />
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
        className="group flex flex-col bg-white dark:bg-[#1B1916] border border-[#E5DED4] dark:border-[#2E2A24] rounded-2xl overflow-hidden cursor-pointer hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all duration-200"
        aria-label={`View details for ${place.name}`}
      >
        {/* 2px accent bar */}
        <div
          className="h-[2px] w-full shrink-0"
          style={{ background: `linear-gradient(to right, ${color}, ${color}80, transparent)` }}
          aria-hidden
        />

        {/* Card header — subtle category tint */}
        <div
          className="flex items-center justify-between gap-2 px-5 pt-4 pb-3"
          style={{ background: `${color}08` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[18px] shrink-0" aria-hidden>{category.emoji}</span>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.1em] truncate"
              style={{ color }}
            >
              {category.shortLabel}
            </span>
          </div>
          {place.isRecommended && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800 px-2 py-0.5 rounded-full shrink-0">
              <Star className="w-2.5 h-2.5 fill-amber-500 dark:fill-amber-400" />
              Pick
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="flex flex-col gap-3 px-5 pb-5 pt-3.5 flex-1">
          <div>
            <h3 className="text-[14px] font-semibold text-stone-800 dark:text-stone-100 leading-snug">
              {place.name}
            </h3>
            {place.neighborhood && (
              <p className="text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-1 mt-1">
                <MapPin className="w-2.5 h-2.5" />
                {place.neighborhood}
              </p>
            )}
          </div>

          {place.seasonal && place.seasonNote && (
            <p className="text-[10px] tracking-wide text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-full w-fit border border-amber-100 dark:border-amber-800">
              {place.seasonNote}
            </p>
          )}

          <p className="text-[13px] text-stone-500 dark:text-stone-400 line-clamp-2 flex-1 leading-relaxed">
            {place.description}
          </p>

          {place.tags.slice(0, 3).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {place.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-stone-400 dark:text-stone-500 bg-[#F7F4EF] dark:bg-stone-900 border border-[#E5DED4] dark:border-stone-800 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[#E5DED4]/60 dark:border-[#2E2A24]/60">
            <CostBadge cost={place.cost} />
            {place.website && (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 flex items-center gap-1 transition-colors"
              >
                Visit <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </article>

      <PlaceDetailDrawer place={place} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
