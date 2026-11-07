import { CostBadge, PickBadge } from "@/components/ui/badges";
import { Card } from "@/components/ui/card";
import { CategoryIcon, categoryColour } from "@/components/ui/category-icon";
import type { PlaceCard as PlaceCardData } from "@/lib/data/types";
import { categoryMeta, type CategorySlug } from "@/lib/domain/categories";
import { whereLine } from "@/lib/domain/where";
import { cn } from "@/lib/cn";
import { OpenBadge } from "./open-badge";
import { PlaceLink } from "./place-link";
import { SaveButton } from "./save-button";

/** Things you go and see are named in the serif; things you go and do, in the sans. */
const SERIF_CATEGORIES = new Set<CategorySlug>(["arts", "dance-music", "events"]);

type PlaceCardProps = {
  place: PlaceCardData;
  /** Show the city name, for lists that span cities. */
  showCity?: boolean;
  /** Leave off "Local pick" where the whole list is picks. */
  showPick?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
};

/** Read in order: what kind of thing, its name, what it is, then cost and where. */
export function PlaceCard({
  place,
  showCity = false,
  showPick = true,
  headingLevel = "h3",
  className,
}: PlaceCardProps) {
  const Heading = headingLevel;
  const where = whereLine(place.neighborhood, showCity ? place.cityName : null);
  return (
    <Card
      as="article"
      interactive
      style={categoryColour(place.category)}
      className={cn("relative flex h-full flex-col overflow-hidden p-4", className)}
    >
      <p className="-mx-4 -mt-4 mb-3 flex min-h-11 items-center gap-1.5 py-2 pr-12 pl-4 text-meta font-medium cat-tint">
        <CategoryIcon slug={place.category} size={16} />
        {categoryMeta(place.category).name}
      </p>
      <Heading
        className={cn(
          "tracking-tight",
          SERIF_CATEGORIES.has(place.category)
            ? "font-display text-lg font-medium"
            : "text-card font-semibold",
        )}
      >
        <PlaceLink placeId={place.id} className="after:absolute after:inset-0 after:rounded-card">
          {place.name}
        </PlaceLink>
      </Heading>
      <p className="mt-1 line-clamp-2 text-meta text-text-muted">{place.summary}</p>
      <div className="mt-auto pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <CostBadge band={place.costBand} />
          {place.weekly && <OpenBadge weekly={place.weekly} />}
          {showPick && place.isPick && <PickBadge />}
        </div>
        {where && <p className="mt-0.5 truncate text-meta text-text-muted">{where}</p>}
      </div>
      <div className="absolute top-0.5 right-1 z-10">
        <SaveButton placeId={place.id} placeName={place.name} />
      </div>
    </Card>
  );
}
