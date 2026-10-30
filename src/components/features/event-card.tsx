import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { CategoryTag, CostBadge } from "@/components/ui/badges";
import { GlassCard } from "@/components/ui/glass-card";
import { Icon } from "@/components/ui/icon";
import type { EventItem } from "@/lib/data/events";
import { eventDateLabel } from "@/lib/domain/event-dates";

export function EventCard({ event, showCity = true }: { event: EventItem; showCity?: boolean }) {
  const href = event.placeId ? (`/places/${event.placeId}` as const) : null;
  return (
    <GlassCard
      as="article"
      interactive={Boolean(href)}
      className="relative flex h-full flex-col gap-2 p-5"
    >
      <div className="flex items-center justify-between gap-3">
        {event.category ? <CategoryTag slug={event.category} /> : <span />}
        <CostBadge band={event.costBand} />
      </div>
      <h3 className="text-card font-semibold tracking-tight">
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
      <p className="line-clamp-2 text-body text-text-muted">{event.description}</p>
      <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-1 text-meta text-text-muted">
        <span className="inline-flex items-center gap-1 font-semibold text-text">
          <Icon icon={CalendarDays} size={16} />
          {eventDateLabel(event.startAt, event.endAt, event.precision)}
        </span>
        {showCity && (
          <span className="inline-flex items-center gap-1">
            <Icon icon={MapPin} size={16} />
            {event.cityName}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
