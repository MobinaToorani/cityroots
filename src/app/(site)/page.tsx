import { ArrowRight, Eye, HandCoins, Search, Sprout } from "lucide-react";
import Link from "next/link";
import { CityCard } from "@/components/features/city-card";
import { Photo, PhotoCredit } from "@/components/features/photo";
import { CostBadge } from "@/components/ui/badges";
import { ButtonLink } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Icon } from "@/components/ui/icon";
import { Container, SectionHeading } from "@/components/ui/section";
import { getSiteStats, listLiveCities } from "@/lib/data/cities";
import { sampleDay } from "@/lib/data/sample-day";
import { estimateSpend } from "@/lib/domain/cost";
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
  const dayTotal = estimateSpend(day.map((s) => s.place.costBand));

  return (
    <>
      {/* Hero */}
      <section
        aria-labelledby="hero-title"
        className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-primary pt-28 pb-14 sm:pb-20"
      >
        {hero && (
          <>
            <Photo photo={hero} alt="" sizes="100vw" priority quality={60} className="-z-20" />
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

      {/* Live counter strip */}
      <section aria-label="CityRoots in numbers" className="py-8 color-field">
        <Container>
          <dl className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { value: stats.cities, label: "cities" },
              { value: stats.places, label: "places, programs, and events" },
              { value: `${stats.freeShare}%`, label: "completely free" },
            ].map((item) => (
              <GlassCard key={item.label} className="flex flex-col-reverse px-4 py-4 sm:px-6">
                <dt className="text-meta text-text-muted">{item.label}</dt>
                <dd className="text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-semibold tracking-tight">
                  {item.value}
                </dd>
              </GlassCard>
            ))}
          </dl>
        </Container>
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
      {day.length > 0 && (
        <section aria-labelledby="planner-title" className="pt-20">
          <Container className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="mb-1 text-meta font-semibold text-primary-text">Day Planner</p>
              <h2
                id="planner-title"
                className="font-display text-section font-medium tracking-tight"
              >
                A whole Saturday in {SAMPLE_CITY.name}, for about ${dayTotal}.
              </h2>
              <p className="mt-4 max-w-md text-body text-text-muted">
                Tell CityRoots your budget and what you like, and it lines up a day: coffee,
                something outside, lunch, an afternoon stop, and an evening plan, with a running
                total. The planner is coming to CityRoots Pro. The places in it are free to browse
                today.
              </p>
              <ButtonLink
                href={exploreHref({ city: SAMPLE_CITY.slug, cost: ["free"] })}
                className="mt-6"
              >
                Find free things in {SAMPLE_CITY.name}
              </ButtonLink>
            </div>
            <div className="relative rounded-[var(--radius-modal)] p-3 color-field sm:p-5">
              <GlassCard strength="strong" className="rounded-[var(--radius-modal)] p-5 sm:p-6">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h3 className="text-card font-semibold">Sample plan</h3>
                  <p className="text-meta text-text-muted">
                    Estimated total{" "}
                    <span className="text-card font-semibold text-text">${dayTotal}</span>
                  </p>
                </div>
                <ol className="grid gap-2">
                  {day.map((stop) => (
                    <li
                      key={stop.place.id}
                      className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 rounded-2xl bg-surface-solid/70 px-3 py-2.5"
                    >
                      <span className="text-meta font-semibold text-text-muted">{stop.time}</span>
                      <span className="min-w-0">
                        <span className="block text-meta text-text-muted">{stop.label}</span>
                        <Link
                          href={`/places/${stop.place.id}`}
                          className="block truncate font-semibold quiet-link"
                        >
                          {stop.place.name}
                        </Link>
                      </span>
                      <CostBadge band={stop.place.costBand} />
                    </li>
                  ))}
                </ol>
              </GlassCard>
            </div>
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
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Eye,
                title: "Free to browse",
                body: "Search, filters, maps, and every listing are free with no account. Pro adds planning tools, never more places.",
              },
              {
                icon: Sprout,
                title: "Free things first",
                body: "The default order always puts free listings ahead of paid ones, in every city and every category.",
              },
              {
                icon: HandCoins,
                title: "Nobody pays for placement",
                body: "Ranking reads only community signals: tips, saves, and how recently details were checked. Money is not an input.",
              },
            ].map((item) => (
              <li key={item.title}>
                <GlassCard className="h-full p-6">
                  <span className="grid size-10 place-items-center rounded-full bg-free-soft text-free">
                    <Icon icon={item.icon} />
                  </span>
                  <h3 className="mt-4 text-card font-semibold">{item.title}</h3>
                  <p className="mt-2 text-body text-text-muted">{item.body}</p>
                </GlassCard>
              </li>
            ))}
          </ul>
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
