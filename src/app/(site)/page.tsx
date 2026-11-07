import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CityCard } from "@/components/features/city-card";
import { CATEGORY_LEDES } from "@/components/features/explorer/category-looks";
import { HeroQuery } from "@/components/features/hero-query";
import { Photo, PhotoCredit } from "@/components/features/photo";
import { PlaceLink } from "@/components/features/place-link";
import { SamplePlan } from "@/components/features/planner/sample-plan";
import { CityLink } from "@/components/features/city-link";
import { WeekList } from "@/components/features/week-list";
import { ButtonLink } from "@/components/ui/button";
import { CATEGORY_ICONS, categoryColour } from "@/components/ui/category-icon";
import { Icon } from "@/components/ui/icon";
import { Container, PageSection } from "@/components/ui/section";
import { getSiteStats, listLiveCities } from "@/lib/data/cities";
import type { EventItem } from "@/lib/data/events";
import { listThisWeek } from "@/lib/data/events";
import { sampleDay } from "@/lib/data/sample-day";
import { CATEGORIES } from "@/lib/domain/categories";
import type { AgendaEntry } from "@/lib/domain/event-dates";
import { showingDay, showingTime } from "@/lib/domain/event-dates";
import { exploreHref } from "@/lib/domain/explore-params";
import { photo } from "@/lib/photos";

export const revalidate = 3600;

const SAMPLE_CITY = { slug: "toronto", name: "Toronto" };

export default async function HomePage() {
  const [cities, day, week, stats] = await Promise.all([
    listLiveCities(),
    sampleDay(SAMPLE_CITY.slug),
    listThisWeek(8),
    getSiteStats(),
  ]);
  const hero = photo("/home/hero.jpg");
  // The hero's note shows the idea working: real, free, dated, this week.
  const freeSoon = week.filter((e) => e.timed && e.event.costBand === "free").slice(0, 3);

  return (
    <>
      <section aria-labelledby="hero-title" className="overflow-hidden">
        <Container className="grid items-center gap-10 pt-10 pb-14 sm:pt-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 lg:pt-20 lg:pb-24">
          <div>
            <h1
              id="hero-title"
              className="font-display text-hero font-medium tracking-tight text-balance"
            >
              Free things to do, close to home.
            </h1>
            <p className="mt-5 max-w-xl text-lede text-text-muted">
              {stats.places.toLocaleString("en-CA")} places, programs, and events across{" "}
              {stats.cities} Ontario cities, {stats.freeShare}% of them free. Every listing is
              checked by hand. No ads, and nobody pays to be listed.
            </p>
            <HeroQuery
              tone="paper"
              cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
              className="mt-8"
            />
          </div>

          {hero && (
            <figure className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-primary sm:aspect-[16/10] lg:aspect-[4/5]">
                <Photo
                  photo={hero}
                  alt="Sunset over the water and trees, Ontario"
                  sizes="(min-width: 1024px) 520px, 100vw"
                  preload
                />
              </div>
              {freeSoon.length > 0 && <FreeSoon items={freeSoon} />}
              <figcaption>
                <PhotoCredit photo={hero} className="mt-2 text-right text-text-muted" />
              </figcaption>
            </figure>
          )}
        </Container>
      </section>

      <section
        aria-labelledby="browse"
        className="border-y border-divider bg-surface-solid py-16 sm:py-20"
      >
        <Container>
          <div className="mb-8 max-w-2xl">
            <h2 id="browse" className="font-display text-section font-medium tracking-tight">
              What are you up for?
            </h2>
            <p className="mt-2 text-body text-text-muted">
              Eleven ways in, from a free swim to a hand with your taxes.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <li key={c.slug} style={categoryColour(c.slug)}>
                <div className="group relative -mx-3 flex items-start gap-4 rounded-card p-3 transition-colors hover:bg-[color-mix(in_oklab,var(--cat)_8%,transparent)]">
                  <span className="grid size-12 shrink-0 place-items-center rounded-control text-[var(--cat)] cat-tint">
                    <Icon icon={CATEGORY_ICONS[c.slug]} size={20} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold tracking-tight">
                      <CityLink
                        href={exploreHref({ cat: [c.slug] })}
                        className="group-hover:underline after:absolute after:inset-0 after:rounded-card"
                      >
                        {c.name}
                      </CityLink>
                    </h3>
                    <p className="mt-0.5 text-meta text-text-muted">{CATEGORY_LEDES[c.slug]}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <PageSection id="cities" title="Pick a city">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {cities.map((city) => (
            <li key={city.id}>
              <CityCard city={city} />
            </li>
          ))}
        </ul>
      </PageSection>

      {week.length > 0 && (
        <PageSection
          id="this-week"
          title="On this week"
          action={
            <ButtonLink href="/events" variant="quiet" className="text-meta">
              See what&apos;s on
              <Icon icon={ArrowRight} size={16} />
            </ButtonLink>
          }
        >
          <WeekList items={week.slice(0, 6)} />
        </PageSection>
      )}

      {day.stops.length > 0 && (
        <section aria-labelledby="planner-title" className="pt-20 sm:pt-28">
          <Container className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            <div>
              <h2
                id="planner-title"
                className="font-display text-section font-medium tracking-tight"
              >
                A whole Saturday in {SAMPLE_CITY.name}, for about ${day.total}.
              </h2>
              <p className="mt-3 max-w-md text-body text-text-muted">
                Set a budget and get a full day out. Swap anything you like.
              </p>
              <ButtonLink href={`/planner?city=${SAMPLE_CITY.slug}`} className="mt-5">
                Plan a day
              </ButtonLink>
            </div>
            <SamplePlan day={day} />
          </Container>
        </section>
      )}

      <p className="sr-only">
        <Link href="/about">About CityRoots</Link>
      </p>
    </>
  );
}

/** A note pinned to the photo: three free things happening soon, each a real link. */
function FreeSoon({ items }: { items: AgendaEntry<EventItem>[] }) {
  return (
    <div className="relative z-10 mx-4 -mt-16 rounded-card p-4 card sm:mx-8 lg:absolute lg:bottom-10 lg:-left-12 lg:mx-0 lg:mt-0 lg:w-80">
      <p className="text-meta font-semibold text-free">Free, coming up</p>
      <ul className="mt-2 divide-y divide-divider">
        {items.map(({ event, at }) => (
          <li key={event.id} className="group relative py-2 first:pt-1 last:pb-0">
            <p className="text-meta text-text-muted">
              {showingDay(at)}, {showingTime(at)} &middot; {event.cityName}
            </p>
            <p className="line-clamp-1 font-semibold tracking-tight">
              {event.placeId ? (
                <PlaceLink
                  placeId={event.placeId}
                  className="group-hover:underline after:absolute after:inset-0"
                >
                  {event.title}
                </PlaceLink>
              ) : (
                event.title
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
