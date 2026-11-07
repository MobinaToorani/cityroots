import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CategoryTile } from "@/components/features/category-tile";
import { CityCard } from "@/components/features/city-card";
import { HeroQuery } from "@/components/features/hero-query";
import { Photo, PhotoCredit } from "@/components/features/photo";
import { WeekList } from "@/components/features/week-list";
import { SamplePlan } from "@/components/features/planner/sample-plan";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container, PageSection } from "@/components/ui/section";
import { listLiveCities } from "@/lib/data/cities";
import { listThisWeek } from "@/lib/data/events";
import { sampleDay } from "@/lib/data/sample-day";
import { CATEGORIES } from "@/lib/domain/categories";
import { exploreHref } from "@/lib/domain/explore-params";
import { photo } from "@/lib/photos";

export const revalidate = 3600;

const SAMPLE_CITY = { slug: "toronto", name: "Toronto" };

export default async function HomePage() {
  const [cities, day, week] = await Promise.all([
    listLiveCities(),
    sampleDay(SAMPLE_CITY.slug),
    listThisWeek(8),
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
        <PageSection
          id="this-week"
          title="On this week"
          action={
            <ButtonLink href="/events" variant="quiet" className="text-meta">
              All events
              <Icon icon={ArrowRight} size={16} />
            </ButtonLink>
          }
        >
          <WeekList items={week} />
        </PageSection>
      )}

      <PageSection id="cities" title="Pick a city">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {cities.map((city) => (
            <li key={city.id}>
              <CityCard city={city} />
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="browse" title="What are you up for?">
        <ul className="grid grid-cols-2 gap-x-6 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <CategoryTile slug={c.slug} href={exploreHref({ cat: [c.slug] })} />
            </li>
          ))}
        </ul>
      </PageSection>

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
