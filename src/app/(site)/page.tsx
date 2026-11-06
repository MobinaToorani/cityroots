import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CategoryTile } from "@/components/features/category-tile";
import { CityCard } from "@/components/features/city-card";
import { EventCard } from "@/components/features/event-card";
import { HeroQuery } from "@/components/features/hero-query";
import { Photo, PhotoCredit } from "@/components/features/photo";
import { SamplePlan } from "@/components/features/planner/sample-plan";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container, SectionHeading } from "@/components/ui/section";
import { listLiveCities } from "@/lib/data/cities";
import { listThisWeek } from "@/lib/data/events";
import { sampleDay } from "@/lib/data/sample-day";
import { CATEGORIES } from "@/lib/domain/categories";
import { showingDay } from "@/lib/domain/event-dates";
import { exploreHref } from "@/lib/domain/explore-params";
import { photo } from "@/lib/photos";

export const revalidate = 3600;

const SAMPLE_CITY = { slug: "toronto", name: "Toronto" };

export default async function HomePage() {
  const [cities, day, week] = await Promise.all([
    listLiveCities(),
    sampleDay(SAMPLE_CITY.slug),
    listThisWeek(10),
  ]);
  const hero = photo("/home/hero.jpg");

  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="relative isolate flex min-h-[min(68svh,620px)] items-end overflow-hidden bg-primary pt-16 pb-10 sm:pb-14"
      >
        {hero && (
          <>
            <Photo photo={hero} alt="" sizes="100vw" preload quality={60} className="-z-20" />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/55 to-black/25"
            />
          </>
        )}
        <Container>
          <h1
            id="hero-title"
            className="max-w-3xl font-display text-display font-medium tracking-tight text-white"
          >
            Free things to do, close to home.
          </h1>
          <HeroQuery cities={cities.map((c) => ({ slug: c.slug, name: c.name }))} />
        </Container>
        {hero && <PhotoCredit photo={hero} className="absolute right-4 bottom-3 text-white/80" />}
      </section>

      {week.length > 0 && (
        <section aria-labelledby="this-week" className="pt-12">
          <Container>
            <SectionHeading
              id="this-week"
              title="On this week"
              className="mb-4"
              action={
                <ButtonLink href="/events" variant="secondary" size="sm">
                  All events
                  <Icon icon={ArrowRight} size={16} />
                </ButtonLink>
              }
            />
          </Container>
          <div className="no-scrollbar overflow-x-auto">
            <ul className="flex w-max snap-x snap-mandatory gap-3 px-5 pb-2 sm:px-8 xl:px-[max(2rem,calc((100vw-1200px)/2+2rem))]">
              {week.map(({ event, at, timed }) => (
                <li key={event.id} className="w-[72vw] max-w-[280px] shrink-0 snap-start">
                  <EventCard event={event} when={timed ? showingDay(at) : "This week"} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section aria-labelledby="browse" className="pt-12">
        <Container>
          <SectionHeading id="browse" title="What are you up for?" className="mb-4" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <CategoryTile slug={c.slug} href={exploreHref({ cat: [c.slug] })} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="cities" className="pt-12">
        <Container>
          <SectionHeading id="cities" title="Pick a city" className="mb-4" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {cities.map((city) => (
              <li key={city.id}>
                <CityCard city={city} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {day.stops.length > 0 && (
        <section aria-labelledby="planner-title" className="pt-14">
          <Container className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
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
