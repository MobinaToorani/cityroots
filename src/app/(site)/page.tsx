import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { CityCard } from "@/components/features/city-card";
import { SamplePlan } from "@/components/features/planner/sample-plan";
import { Photo, PhotoCredit } from "@/components/features/photo";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container, SectionHeading } from "@/components/ui/section";
import { getSiteStats, listLiveCities } from "@/lib/data/cities";
import { sampleDay } from "@/lib/data/sample-day";
import { exploreHref } from "@/lib/domain/explore-params";
import { photo } from "@/lib/photos";

export const revalidate = 3600;

const SAMPLE_CITY = { slug: "newmarket", name: "Newmarket" };

export default async function HomePage() {
  const [stats, cities, day] = await Promise.all([
    getSiteStats(),
    listLiveCities(),
    sampleDay(SAMPLE_CITY.slug),
  ]);
  const hero = photo("/home/hero.jpg");

  return (
    <>
      {/* Hero */}
      <section
        aria-labelledby="hero-title"
        className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-primary pt-28 pb-14 sm:pb-20"
      >
        {hero && (
          <>
            <Photo photo={hero} alt="" sizes="100vw" preload quality={60} className="-z-20" />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/45 to-black/10"
            />
          </>
        )}
        <Container>
          <p className="mb-4 text-meta font-semibold text-white/90">
            {stats.cities} cities across the GTA and Waterloo Region
          </p>
          <h1
            id="hero-title"
            className="max-w-3xl font-display text-display font-medium tracking-tight text-white"
          >
            Do more for less, close to home.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            Free and low-cost places, programs, and events, picked by people who live here. Every
            listing tells you what it costs before you go.
          </p>
          <form
            action="/explore"
            method="get"
            role="search"
            className="mt-8 flex max-w-xl items-center gap-2 rounded-full p-1.5 pl-5 glass-strong"
          >
            <Icon icon={Search} className="shrink-0 text-text-muted" />
            <label htmlFor="hero-search" className="sr-only">
              Search places, cities, and categories
            </label>
            <input
              id="hero-search"
              name="q"
              type="search"
              autoComplete="off"
              placeholder="Try: free things in Newmarket"
              className="h-11 min-w-0 flex-1 bg-transparent text-base text-text outline-none placeholder:text-text-muted"
            />
            <button
              type="submit"
              className="motion-press inline-flex h-11 shrink-0 items-center rounded-full bg-primary px-5 font-semibold text-white transition-colors hover:bg-primary-hover active:translate-y-px"
            >
              Search
            </button>
          </form>
        </Container>
        {hero && <PhotoCredit photo={hero} className="absolute right-4 bottom-3 text-white/80" />}
      </section>

      {/* City guides */}
      <section aria-labelledby="cities" className="pt-16">
        <Container>
          <SectionHeading
            id="cities"
            eyebrow="City guides"
            title="Pick a city"
            description="Each guide starts with a few favorites, then everything else sorted with free first."
            action={
              <ButtonLink href="/explore" variant="secondary" size="sm">
                See every place
                <Icon icon={ArrowRight} size={16} />
              </ButtonLink>
            }
          />
        </Container>
        <div className="no-scrollbar overflow-x-auto scroll-smooth">
          <ul className="mx-auto flex w-max max-w-none snap-x snap-mandatory gap-4 px-5 pb-4 sm:px-8 xl:px-[max(2rem,calc((100vw-1200px)/2+2rem))]">
            {cities.map((city) => (
              <li key={city.id} className="w-[70vw] max-w-[280px] shrink-0 snap-start">
                <CityCard city={city} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Day Planner teaser */}
      {day.stops.length > 0 && (
        <section aria-labelledby="planner-title" className="pt-20">
          <Container className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="mb-1 text-meta font-semibold text-primary-text">Day Planner</p>
              <h2
                id="planner-title"
                className="font-display text-section font-medium tracking-tight"
              >
                A whole Saturday in {SAMPLE_CITY.name}, for about ${day.total}.
              </h2>
              <p className="mt-4 max-w-md text-body text-text-muted">
                Tell CityRoots your budget and what you like, and it lines up a day: coffee,
                something free, lunch, an afternoon stop, and an evening plan, with a running total
                and a link to share it. The Day Planner is part of CityRoots Pro. Every place in it
                is free to browse.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <ButtonLink href="/planner">Plan a Saturday</ButtonLink>
                <ButtonLink
                  href={exploreHref({ city: SAMPLE_CITY.slug, cost: ["free"] })}
                  variant="secondary"
                >
                  Find free things in {SAMPLE_CITY.name}
                </ButtonLink>
              </div>
            </div>
            <SamplePlan day={day} />
          </Container>
        </section>
      )}

      {/* Model transparency */}
      <section aria-labelledby="model-title" className="pt-24">
        <Container>
          <h2
            id="model-title"
            className="max-w-3xl font-display text-section font-medium tracking-tight"
          >
            Free to browse. Free things first. Nobody pays for placement.
          </h2>
          <dl className="mt-8 max-w-3xl divide-y divide-divider border-y border-divider">
            {[
              {
                title: "Free to browse",
                body: "Search, filters, maps, and every listing are free with no account. Pro adds planning tools, never more places.",
              },
              {
                title: "Free things first",
                body: "The default order always puts free listings ahead of paid ones, in every city and every category.",
              },
              {
                title: "Nobody pays for placement",
                body: "Ranking reads only community signals: tips, saves, and how recently details were checked. Money is not an input.",
              },
            ].map((item) => (
              <div key={item.title} className="grid gap-1 py-5 sm:grid-cols-[14rem_1fr] sm:gap-6">
                <dt className="text-card font-semibold">{item.title}</dt>
                <dd className="text-body text-text-muted">{item.body}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6">
            <Link href="/about" className="font-semibold text-primary-text quiet-link">
              Read how CityRoots is funded
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}
