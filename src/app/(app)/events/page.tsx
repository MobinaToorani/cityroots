import { CalendarX, ChevronDown } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { EventRow } from "@/components/features/event-row";
import { RememberCity } from "@/components/layout/city-picker";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChipLink } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { listLiveCities } from "@/lib/data/cities";
import { listUpcomingEvents, type EventItem } from "@/lib/data/events";
import { compareCostBands } from "@/lib/domain/cost";
import {
  buildAgenda,
  eventDateLabel,
  EVENT_WHEN,
  EVENT_WHEN_LABELS,
  runsUntil,
  showingDay,
  showingTime,
  type EventWhen,
} from "@/lib/domain/event-dates";
import { exploreHref } from "@/lib/domain/explore-params";

function eventsHref(city: string | null, free: boolean, when: EventWhen): Route {
  const params = new URLSearchParams({ when });
  if (city) params.set("city", city);
  if (free) params.set("cost", "free");
  return `/events?${params.toString()}` as Route;
}

/** With no choice made, the soonest time that has something on. */
function soonest(items: EventItem[], now: Date): EventWhen {
  const found = EVENT_WHEN.find((w) => buildAgenda(items, w, now).days.length > 0);
  return found ?? "week";
}

export async function generateMetadata(props: PageProps<"/events">): Promise<Metadata> {
  const { city } = await props.searchParams;
  const cities = await listLiveCities();
  const name = cities.find((c) => c.slug === city)?.name;
  return {
    title: name ? `Free and low-cost events in ${name}` : "Free and low-cost events",
    description: `Festivals, markets, and community events${name ? ` in ${name}` : " across the GTA and Waterloo Region"}, with what they cost.`,
    alternates: { canonical: name ? `/events?city=${city}` : "/events" },
  };
}

export default async function EventsPage(props: PageProps<"/events">) {
  const params = await props.searchParams;
  const now = new Date();
  const cities = await listLiveCities();
  const city =
    typeof params.city === "string" && cities.some((c) => c.slug === params.city)
      ? params.city
      : null;
  const freeOnly = params.cost === "free";
  const items = await listUpcomingEvents({ city, freeOnly, now });
  const when: EventWhen = (EVENT_WHEN as readonly unknown[]).includes(params.when)
    ? (params.when as EventWhen)
    : soonest(items, now);
  const { days, running, seasonal } = buildAgenda(items, when, now);
  const cityName = cities.find((c) => c.slug === city)?.name;
  const empty = days.length === 0 && running.length === 0 && seasonal.length === 0;
  const freeFirst =
    <T,>(get: (x: T) => EventItem) =>
    (a: T, b: T) =>
      compareCostBands(get(a).costBand, get(b).costBand);

  return (
    <div className="mx-auto max-w-[1000px] px-4 pt-6 sm:px-6">
      <RememberCity slug={city} clearWhenEmpty />
      <h1 className="mb-4 text-section font-semibold tracking-tight">
        {cityName ? `What's on in ${cityName}` : "What's on"}
      </h1>

      <div role="group" aria-label="When" className="mb-6 flex flex-wrap items-center gap-2">
        {EVENT_WHEN.map((w) => (
          <ChipLink key={w} href={eventsHref(city, freeOnly, w)} active={when === w}>
            {EVENT_WHEN_LABELS[w]}
          </ChipLink>
        ))}
        <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-divider sm:block" />
        <ChipLink href={eventsHref(city, !freeOnly, when)} active={freeOnly}>
          Free only
        </ChipLink>
      </div>

      {empty ? (
        <EmptyState
          icon={CalendarX}
          title={`Nothing listed for ${EVENT_WHEN_LABELS[when].toLowerCase()}`}
          action={
            <ButtonLink
              href={
                when === "later"
                  ? exploreHref({ city, type: ["event"] })
                  : eventsHref(city, freeOnly, "later")
              }
              size="sm"
            >
              {when === "later" ? "See all event listings" : "See what's coming later"}
            </ButtonLink>
          }
        >
          {cityName ?? "This area"} has more on some weeks than others.
        </EmptyState>
      ) : (
        <div className="grid gap-8">
          {days.map((day) => (
            <section key={day.key} aria-labelledby={`d-${day.key}`}>
              <h2 id={`d-${day.key}`} className="mb-2 text-card font-semibold">
                {day.label}
              </h2>
              <Card as="ul" className="divide-y divide-divider overflow-hidden">
                {day.entries.map(({ event, at, timed }) => (
                  <li key={event.id}>
                    <EventRow
                      event={event}
                      showCity={!city}
                      when={when === "later" ? showingDay(at) : timed ? showingTime(at) : "All day"}
                    />
                  </li>
                ))}
              </Card>
            </section>
          ))}

          {running.length > 0 && (
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-card font-semibold [&::-webkit-details-marker]:hidden">
                Exhibits and markets running now
                <span className="text-meta font-normal text-text-muted">{running.length}</span>
                <Icon
                  icon={ChevronDown}
                  size={16}
                  className="transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <Card as="ul" className="mt-2 divide-y divide-divider overflow-hidden">
                {[...running].sort(freeFirst((e) => e.event)).map(({ event }) => (
                  <li key={event.id}>
                    <EventRow
                      event={event}
                      showCity={!city}
                      when={runsUntil(event.endAt) ?? "Ongoing"}
                    />
                  </li>
                ))}
              </Card>
            </details>
          )}

          {seasonal.length > 0 && (
            <section aria-labelledby="seasonal">
              <h2 id="seasonal" className="mb-2 text-card font-semibold">
                {when === "later" ? "Usually later in the year" : "In season"}
              </h2>
              <Card as="ul" className="divide-y divide-divider overflow-hidden">
                {[...seasonal].sort(freeFirst((e) => e)).map((event) => (
                  <li key={event.id}>
                    <EventRow
                      event={event}
                      showCity={!city}
                      when={eventDateLabel(event.startAt, event.endAt, "month").replace(
                        "Usually ",
                        "",
                      )}
                    />
                  </li>
                ))}
              </Card>
            </section>
          )}

          <p className="text-meta text-text-muted">
            Dates change. Check the listing before you go.{" "}
            <Link
              href={exploreHref({ city, type: ["event"] })}
              className="font-semibold text-primary-text quiet-link"
            >
              Every event listing
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
