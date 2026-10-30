import { MapPin } from "lucide-react";
import Link from "next/link";
import { CategoryTag, CostBadge, PickBadge } from "@/components/ui/badges";
import { GlassCard } from "@/components/ui/glass-card";
import { Icon } from "@/components/ui/icon";
import type { PlaceCard as PlaceCardData } from "@/lib/data/types";
import { cn } from "@/lib/cn";

type PlaceCardProps = {
  place: PlaceCardData;
  /** Show the city name, for lists that span cities. */
  showCity?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
};

export function PlaceCard({
  place,
  showCity = false,
  headingLevel = "h3",
  className,
}: PlaceCardProps) {
  const Heading = headingLevel;
  const where = [place.neighborhood, showCity ? place.cityName : null].filter(Boolean).join(", ");
  return (
    <GlassCard
      as="article"
      interactive
      className={cn("group relative flex h-full flex-col gap-3 p-5", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <CategoryTag slug={place.category} />
        <div className="flex items-center gap-1.5">
          {place.isPick && <PickBadge />}
          <CostBadge band={place.costBand} />
        </div>
      </div>
      <Heading className="text-card font-semibold tracking-tight">
        <Link
          href={`/places/${place.id}`}
          className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]"
        >
          {place.name}
        </Link>
      </Heading>
      <p className="line-clamp-2 text-body text-text-muted">{place.summary}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-meta text-text-muted">
        {where && (
          <span className="inline-flex items-center gap-1">
            <Icon icon={MapPin} size={16} />
            {where}
          </span>
        )}
        {place.priceNote && place.costBand !== "free" && (
          <span className="line-clamp-1">{place.priceNote}</span>
        )}
      </div>
    </GlassCard>
  );
}
