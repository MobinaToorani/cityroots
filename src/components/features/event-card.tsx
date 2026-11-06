import Link from "next/link";
import { CostBadge } from "@/components/ui/badges";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { EventItem } from "@/lib/data/events";

/** Compact card for a horizontal strip of events. */
export function EventCard({
  event,
  when,
  showCity = true,
}: {
  event: EventItem;
  when: string;
  showCity?: boolean;
}) {
  const href = event.placeId ? (`/places/${event.placeId}` as const) : null;
  const where = [event.neighborhood, showCity ? event.cityName : null].filter(Boolean).join(", ");
  return (
    <Card
      as="article"
      interactive={Boolean(href)}
      className="relative flex h-full flex-col gap-2 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-meta font-semibold text-primary-text">{when}</p>
        <CostBadge band={event.costBand} />
      </div>
      <h3 className="line-clamp-2 text-card font-semibold tracking-tight">
        {href ? (
          <Link
            href={href}
            className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]"
          >
            {event.title}
          </Link>
        ) : (
          event.title
        )}
      </h3>
      <div className="mt-auto flex items-center gap-2 pt-1 text-meta text-text-muted">
        {event.category && (
          <CategoryIcon slug={event.category} className="size-7 rounded-lg [&_svg]:size-4" />
        )}
        <span className="min-w-0 truncate">{where}</span>
      </div>
    </Card>
  );
}
