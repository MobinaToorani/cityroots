import type { EventItem } from "@/lib/data/events";
import type { AgendaEntry } from "@/lib/domain/event-dates";
import { showingDay, showingTime } from "@/lib/domain/event-dates";
import { EventRow } from "./event-row";

/** "On this week": a schedule in two columns that always fits the page. */
export function WeekList({
  items,
  showCity = true,
}: {
  items: AgendaEntry<EventItem>[];
  showCity?: boolean;
}) {
  // An even count keeps the two columns level.
  const shown = items.length > 1 ? items.slice(0, items.length - (items.length % 2)) : items;
  return (
    <ul className="grid grid-cols-1 gap-x-12 lg:grid-cols-2">
      {shown.map(({ event, at, timed }) => (
        <li key={event.id} className="min-w-0 border-t border-divider">
          <EventRow
            event={event}
            showCity={showCity}
            when={timed ? showingDay(at) : "This week"}
            whenDetail={timed ? showingTime(at) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
