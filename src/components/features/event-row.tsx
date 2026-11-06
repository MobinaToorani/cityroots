import Link from "next/link";
import { CostBadge } from "@/components/ui/badges";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { EventItem } from "@/lib/data/events";
import { cn } from "@/lib/cn";

type EventRowProps = {
  event: EventItem;
  /** The left column: a time, a date, or how long it runs. */
  when: string;
  showCity?: boolean;
  headingLevel?: "h3" | "h4";
};

/** One line of the agenda, built to be scanned: when, what, where, how much. */
export function EventRow({ event, when, showCity = false, headingLevel = "h3" }: EventRowProps) {
  const Heading = headingLevel;
  const href = event.placeId ? (`/places/${event.placeId}` as const) : null;
  const where = [event.neighborhood, showCity ? event.cityName : null].filter(Boolean).join(", ");
  return (
    <article
      className={cn(
        "relative grid grid-cols-[4.75rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 sm:grid-cols-[6rem_2.5rem_minmax(0,1fr)_auto] sm:px-4",
        href && "transition-colors duration-150 hover:bg-bg",
      )}
    >
      <p className="text-meta font-semibold">{when}</p>
      {event.category && <CategoryIcon slug={event.category} className="hidden sm:grid" />}
      <div className={cn("min-w-0", !event.category && "sm:col-start-3")}>
        <Heading className="line-clamp-2 font-semibold tracking-tight">
          {href ? (
            <Link href={href} className="after:absolute after:inset-0">
              {event.title}
            </Link>
          ) : (
            event.title
          )}
        </Heading>
        {where && <p className="truncate text-meta text-text-muted">{where}</p>}
      </div>
      <CostBadge band={event.costBand} />
    </article>
  );
}
