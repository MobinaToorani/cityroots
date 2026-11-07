import { CostBadge } from "@/components/ui/badges";
import { Card } from "@/components/ui/card";
import type { SampleDay } from "@/lib/data/sample-day";
import { PlaceLink } from "@/components/features/place-link";

/** A read-only day plan, used as a preview of the Day Planner. */
export function SamplePlan({ day }: { day: SampleDay }) {
  return (
    <Card as="ol" className="divide-y divide-divider overflow-hidden">
      {day.stops.map((stop) => (
        <li
          key={stop.place.id}
          className="grid grid-cols-[3.75rem_minmax(0,1fr)_auto] items-baseline gap-3 px-4 py-3"
        >
          <span className="text-meta font-semibold text-text-muted">{stop.time}</span>
          <span className="min-w-0">
            <span className="block text-meta text-text-muted">{stop.label}</span>
            <PlaceLink
              placeId={stop.place.id}
              className="block truncate font-semibold hover:underline"
            >
              {stop.place.name}
            </PlaceLink>
          </span>
          <CostBadge band={stop.place.costBand} />
        </li>
      ))}
    </Card>
  );
}
