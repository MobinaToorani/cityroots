import { Star } from "lucide-react";
import Link from "next/link";
import { CostBadge } from "@/components/ui/badges";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Icon } from "@/components/ui/icon";
import type { PlaceCard as PlaceCardData } from "@/lib/data/types";
import { cn } from "@/lib/cn";
import { OpenBadge } from "./open-badge";
import { SaveButton } from "./save-button";

type PlaceCardProps = {
  place: PlaceCardData;
  /** Show the city name, for lists that span cities. */
  showCity?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
};

/** Read in order: what kind of thing, its name, what it is, then cost and where. */
export function PlaceCard({
  place,
  showCity = false,
  headingLevel = "h3",
  className,
}: PlaceCardProps) {
  const Heading = headingLevel;
  const where = [place.neighborhood, showCity ? place.cityName : null].filter(Boolean).join(", ");
  return (
    <Card as="article" interactive className={cn("relative flex h-full gap-3.5 p-4", className)}>
      <CategoryIcon slug={place.category} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Heading className="pr-8 text-card font-semibold tracking-tight">
          <Link
            href={`/places/${place.id}`}
            className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]"
          >
            {place.name}
          </Link>
        </Heading>
        <p className="mt-1 line-clamp-2 text-meta text-text-muted">{place.summary}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pt-3 text-meta text-text-muted">
          <CostBadge band={place.costBand} />
          {place.weekly && <OpenBadge weekly={place.weekly} />}
          {place.isPick && (
            <span className="inline-flex items-center gap-1 font-semibold text-pick">
              <Icon icon={Star} size={16} fill="currentColor" />
              Local pick
            </span>
          )}
          {where && <span className="min-w-0 truncate">{where}</span>}
        </div>
      </div>
      <SaveButton placeId={place.id} placeName={place.name} className="absolute top-2 right-2" />
    </Card>
  );
}
