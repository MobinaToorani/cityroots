import { CalendarX } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { EventCard } from "@/components/features/event-card";
import { ButtonLink } from "@/components/ui/button";
import { ChipLink } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterDropdown, FilterOption } from "@/components/ui/filter-dropdown";
import { listLiveCities } from "@/lib/data/cities";
import { listUpcomingEvents, type EventItem } from "@/lib/data/events";
import { compareCostBands } from "@/lib/domain/cost";
import { exploreHref } from "@/lib/domain/explore-params";

export const revalidate = 3600;

function eventsHref(city: string | null, free: boolean): Route {
  const params = new URLSearchParams();
  if (city) params.set("city", city);
  if (free) params.set("cost", "free");
  const q = params.toString();
  return (q ? `/events?${q}` : "/events") as Route;
}

export async function generateMetadata(props: PageProps<"/events">): Promise<Metadata> {
  const { city } = await props.searchParams;
  const cities = await listLiveCities();
  const name = cities.find((c) => c.slug === city)?.name;
  return {
    title: name ? `Free and low-cost events in ${name}` : "Free and low-cost events",
    description: `Festivals, markets, and community events${name ? ` in ${name}` : " across the GTA and Waterloo Region"}, free ones first.`,
    alternates: { canonical: name ? `/events?city=${city}` : "/events" },
  };
}

const monthTitle = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "UTC" }).format(d);

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

  const freeFirst = (a: EventItem, b: EventItem) =>
    compareCostBands(a.costBand, b.costBand) || a.startAt.getTime() - b.startAt.getTime();
  const happening = items.filter((e) => e.startAt <= now).sort(freeFirst);
  const byMonth = new Map<string, { month: Date; items: EventItem[] }>();
  for (const e of items.filter((i) => i.startAt > now)) {
    const month = new Date(Date.UTC(e.startAt.getUTCFullYear(), e.startAt.getUTCMonth(), 1));
    const key = month.toISOString();
    if (!byMonth.has(key)) byMonth.set(key, { month, items: [] });
    byMonth.get(key)?.items.push(e);
  }
  const months = [...byMonth.values()].sort((a, b) => a.month.getTime() - b.month.getTime());
  const cityName = cities.find((c) => c.slug === city)?.name;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-4 sm:px-8 lg:pt-8">
      <header className="mb-6">
        <h1 className="text-section font-semibold tracking-tight">
          {cityName ? `Events in ${cityName}` : "Events and festivals"}
        </h1>
        <p className="mt-1 max-w-2xl text-body text-text-muted">
          Recurring festivals, markets, and community events. Most organizers announce exact dates a
          few weeks ahead, so &ldquo;usually&rdquo; means check the listing before you go.
        </p>
      </header>

      <div
        role="group"
        aria-label="Filters"
        className="relative z-20 mb-8 flex flex-wrap items-center gap-2"
      >
        <FilterDropdown label="City" summary={cityName ?? "All cities"} active={Boolean(city)}>
          <FilterOption mode="single" href={eventsHref(null, freeOnly)} selected={!city}>
            All cities
          </FilterOption>
          {cities.map((c) => (
            <FilterOption
              key={c.slug}
              mode="single"
              href={eventsHref(c.slug, freeOnly)}
              selected={city === c.slug}
            >
              {c.name}
            </FilterOption>
          ))}
        </FilterDropdown>
        <ChipLink href={eventsHref(city, !freeOnly)} active={freeOnly}>
          Free only
        </ChipLink>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="No dated events here yet"
          action={
            <ButtonLink href={exploreHref({ city, type: ["event"] })} size="sm">
              See all event listings
            </ButtonLink>
          }
        >
          Some events do not have dates yet. Their listings are still worth a look.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-12">
          {happening.length > 0 && (
            <section aria-labelledby="now">
              <h2 id="now" className="mb-4 text-card font-semibold">
                In season now{" "}
                <span className="font-normal text-text-muted">({happening.length})</span>
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {happening.map((e) => (
                  <li key={e.id}>
                    <EventCard event={e} showCity={!city} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {months.map(({ month, items: list }) => (
            <section
              key={month.toISOString()}
              aria-labelledby={`m-${month.toISOString().slice(0, 7)}`}
              // Later months skip layout and paint until scrolled near (first-load TBT).
              className="[contain-intrinsic-block-size:auto_640px] [content-visibility:auto]"
            >
              <h2
                id={`m-${month.toISOString().slice(0, 7)}`}
                className="mb-4 text-card font-semibold"
              >
                Starting in {monthTitle(month)}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.sort(freeFirst).map((e) => (
                  <li key={e.id}>
                    <EventCard event={e} showCity={!city} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="text-body text-text-muted">
            Looking for something without a set date?{" "}
            <Link
              href={exploreHref({ city, type: ["event"] })}
              className="font-semibold text-primary-text quiet-link"
            >
              Browse every event listing
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
