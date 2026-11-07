import { Clock, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { CostBadge } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import type { GuideStop as Stop } from "@/lib/data/places";
import { PlaceLink } from "@/components/features/place-link";

/** One numbered stop in a guide: the listing's facts, then the guide's words about it. */
export function GuideStop({
  stop,
  position,
  children,
}: {
  stop: Stop;
  position: number;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`stop-${stop.slug}`} className="mt-12 border-t border-divider pt-8">
      <p className="text-meta font-semibold text-primary-text">Stop {position}</p>
      <h2
        id={`stop-${stop.slug}`}
        className="mt-1 font-display text-section font-medium tracking-tight"
      >
        <PlaceLink placeId={stop.id} className="quiet-link">
          {stop.name}
        </PlaceLink>
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-meta text-text-muted">
        <CostBadge band={stop.costBand} />
        {stop.priceNote && <span>{stop.priceNote}</span>}
        {stop.neighborhood && (
          <span className="inline-flex items-center gap-1">
            <Icon icon={MapPin} size={16} />
            {stop.neighborhood}
          </span>
        )}
        {stop.hours && (
          <span className="inline-flex items-center gap-1">
            <Icon icon={Clock} size={16} />
            {stop.hours}
          </span>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}
