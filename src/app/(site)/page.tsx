import { ArrowRight, MapPin } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { CityLink } from "@/components/features/city-link";
import { HeroQuery } from "@/components/features/hero-query";
import { Photo, PhotoCredit } from "@/components/features/photo";
import { PlaceLink } from "@/components/features/place-link";
import { SamplePlan } from "@/components/features/planner/sample-plan";
import { CircleArrow, PillLink } from "@/components/ui/arrow-link";
import { ButtonLink } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/section";
import { GUIDES } from "@/content/guides";
import { getCategoryCounts, getSiteStats, listLiveCities } from "@/lib/data/cities";
import { listThisWeek } from "@/lib/data/events";
import { listCategorySamples } from "@/lib/data/places";
import { sampleDay } from "@/lib/data/sample-day";
import type { CitySummary } from "@/lib/data/types";
import { CATEGORIES } from "@/lib/domain/categories";
import { showingDay, showingTime } from "@/lib/domain/event-dates";
import { exploreHref } from "@/lib/domain/explore-params";
import { budgetLabel } from "@/lib/domain/guides";
import { whereLine } from "@/lib/domain/where";
import { photo, type PhotoInfo } from "@/lib/photos";
import { cn } from "@/lib/cn";

export const revalidate = 3600;

const SAMPLE_CITY = { slug: "toronto", name: "Toronto" };

/**
 * Every city matters equally, so the cities shown in photos change each day
 * instead of one always leading.
 */
function rotate<T>(items: readonly T[], offset = 0): T[] {
  if (items.length === 0) return [];
  const start = (Math.floor(Date.now() / 86_400_000) + offset) % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

type CityWithPhoto = CitySummary & { photo: PhotoInfo };

export default async function HomePage() {
  const [cities, day, week, stats, counts, samples] = await Promise.all([
    listLiveCities(),
    sampleDay(SAMPLE_CITY.slug),
    listThisWeek(500),
    getSiteStats(),
    getCategoryCounts(),
    listCategorySamples(3),
  ]);
  const withPhotos: CityWithPhoto[] = cities.flatMap((c) => {
    const p = photo(c.heroImage);
    return p ? [{ ...c, photo: p }] : [];
  });
  const photoOf = new Map(withPhotos.map((c) => [c.slug, c.photo]));
  const collage = rotate(withPhotos).slice(0, 3);
  const featured = rotate(withPhotos, 5)[0];
  const countOf = new Map(counts.map((c) => [c.slug, c.count]));
  const landscape = photo("/home/hero.jpg");
  const guides = [...GUIDES].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);

  return (
    <>
      {/* Hero: the point of the site in one screen, on warm paper, with real cities beside it. */}
      <section aria-labelledby="hero-title" className="relative isolate">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-[calc(100%-4rem)] overflow-hidden bg-sand lg:h-[calc(100%-7rem)]"
        >
          {landscape && (
            <div className="absolute bottom-0 left-0 hidden h-60 w-[62%] [mask-image:linear-gradient(to_top,black_40%,transparent),linear-gradient(to_right,black_50%,transparent)] [mask-composite:intersect] lg:block">
              <Photo photo={landscape} alt="" sizes="62vw" quality={60} />
            </div>
          )}
        </div>
        <Container className="grid gap-10 pt-10 pb-4 sm:pt-14 lg:grid-cols-2 lg:gap-12 lg:pt-20">
          <div className="relative lg:pb-80">
            <p className="inline-flex items-center gap-2 rounded-full border border-text/10 bg-surface-solid/70 py-1 pr-3 pl-1 text-meta font-semibold">
              <span className="grid size-6 place-items-center rounded-full bg-ink text-on-ink">
                <Icon icon={MapPin} size={16} className="size-3.5" />
              </span>
              {stats.cities} Ontario cities, no ads
            </p>
            <h1
              id="hero-title"
              className="mt-5 font-display text-hero font-medium tracking-tight text-balance"
            >
              Free things to do, close to home.
            </h1>
            <p className="mt-5 max-w-lg text-lede text-text-muted">
              Parks and pools, libraries, markets, drop-ins, and festivals, each with what it costs
              and when it&apos;s open. Checked by hand, and nobody pays to be listed.
            </p>
            <HeroQuery
              tone="paper"
              cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
              className="mt-7"
            />
            <HandArrow className="absolute top-[46%] -right-6 hidden w-24 rotate-12 text-primary-text xl:block" />
          </div>

          <Collage cities={collage} />
        </Container>
      </section>

      {/* What CityRoots is, and the numbers behind it. */}
      <section aria-labelledby="about-title" className="pt-14 sm:pt-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
            <h2
              id="about-title"
              className="max-w-md font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-tight font-medium tracking-tight"
            >
              A good day out shouldn&apos;t depend on what you can spend.
            </h2>
            <div className="max-w-xl text-body text-text-muted">
              <p>
                CityRoots is a guide to the free and low-cost side of ten Ontario cities: trails and
                rinks, quiet rooms and support lines, clubs, markets, studios, and the places that
                need a hand.
              </p>
              <p className="mt-3">
                Every listing says what it costs, when it&apos;s open, and where it is. Events drop
                off the site once they end, so what you see is what you can still go to.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-5">
                <ButtonLink href="/explore" variant="ink">
                  Find things to do
                  <Icon icon={ArrowRight} size={16} />
                </ButtonLink>
                <Link href="/about" className="text-meta font-semibold text-text quiet-link">
                  About CityRoots
                </Link>
              </div>
            </div>
          </div>

          <ul className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Fact
              figure={stats.places.toLocaleString("en-CA")}
              label="Places and programs"
              note="Each says roughly what it costs before you go."
            />
            <Fact
              figure={`${stats.freeShare}%`}
              label="Free to go"
              note="The rest are low cost, and say so."
            />
            <Fact
              figure={String(stats.cities)}
              label="Ontario cities"
              note="Toronto, York Region, Halton, and Waterloo Region."
            />
            <Fact
              figure={String(week.length)}
              label="On this week"
              note="Dated events in the next seven days."
            />
          </ul>
        </Container>
      </section>

      {/* Categories as photo cards, each with a few real places to start from. */}
      <section aria-labelledby="browse" className="pt-20 sm:pt-28">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 id="browse" className="font-display text-section font-medium tracking-tight">
              What are you up for?
            </h2>
            <PillLink href="/explore">All things to do</PillLink>
          </div>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {CATEGORIES.map((c) => {
              const image = photo(`/categories/${c.slug}.jpg`);
              const count = countOf.get(c.slug) ?? 0;
              return (
                <li
                  key={c.slug}
                  className="group motion-lift flex gap-4 rounded-card p-3 card hover:border-text-muted/30"
                >
                  <div className="photo-zoom relative aspect-[4/3] w-28 shrink-0 self-start overflow-hidden rounded-control bg-sand sm:w-36">
                    {image && (
                      <Photo photo={image} alt="" sizes="(min-width: 640px) 144px, 112px" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <h3 className="flex items-center gap-2 font-semibold tracking-tight">
                      <CategoryIcon slug={c.slug} size={16} />
                      <CityLink href={exploreHref({ cat: [c.slug] })} className="hover:underline">
                        {c.name}
                      </CityLink>
                    </h3>
                    <p className="text-meta text-text-muted">
                      {count === 1 ? "1 place" : `${count} places`}
                    </p>
                    <ul className="mt-1.5 grid">
                      {(samples.get(c.slug) ?? []).map((s) => (
                        <li key={s.id} className="flex min-w-0 text-meta">
                          <PlaceLink
                            placeId={s.id}
                            className="truncate leading-6 hover:text-primary-text hover:underline"
                          >
                            {s.name}
                          </PlaceLink>
                          <span className="hidden shrink-0 text-text-muted sm:inline">
                            &nbsp;&middot; {s.cityName}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* Cities over a landscape, with one city given the photo each day. */}
      <section aria-labelledby="cities" className="relative isolate mt-20 py-16 sm:mt-28 sm:py-24">
        {landscape && (
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-primary">
            <Photo photo={landscape} alt="" sizes="100vw" quality={60} />
          </div>
        )}
        <Container>
          <div className="grid gap-6 rounded-modal bg-surface-solid p-5 shadow-[var(--shadow-lift)] sm:p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-8">
            <div>
              <h2 id="cities" className="font-display text-section font-medium tracking-tight">
                Pick a city
              </h2>
              <ul className="mt-5 grid grid-cols-2 gap-2">
                {cities.map((city) => (
                  <li key={city.id}>
                    <Link
                      href={`/city/${city.slug}`}
                      className="group motion-lift flex items-center gap-3 rounded-card border border-divider bg-surface-solid px-3 py-2 hover:border-text-muted/30 sm:pl-2"
                    >
                      <span className="hidden size-10 shrink-0 place-items-center rounded-control bg-sand text-text transition-colors duration-300 group-hover:bg-primary group-hover:text-white sm:grid">
                        <Icon icon={MapPin} size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold group-hover:underline">
                          {city.name}
                        </span>
                        <span className="text-meta text-text-muted">{city.browseCount} places</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {featured && <FeaturedCity city={featured} />}
          </div>
        </Container>
        {landscape && (
          <PhotoCredit photo={landscape} className="absolute right-4 bottom-3 text-white/85" />
        )}
      </section>

      {/* This week, as a run of tickets. */}
      {week.length > 0 && (
        <section aria-labelledby="this-week" className="pt-20 sm:pt-28">
          <Container>
            <div className="rounded-modal bg-sand p-3 sm:p-6">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-1 pt-1">
                <h2 id="this-week" className="font-display text-section font-medium tracking-tight">
                  On this week
                </h2>
                <div className="flex flex-wrap items-center gap-4">
                  <p className="max-w-xs text-meta text-text-muted">
                    Free first. Everything here is still to come.
                  </p>
                  <PillLink href="/events">What&apos;s on</PillLink>
                </div>
              </div>
              <ul className="grid gap-2">
                {week.slice(0, 5).map(({ event, at, timed }) => {
                  const image = photoOf.get(event.citySlug);
                  const where = whereLine(event.neighborhood, event.cityName);
                  const when = timed ? `${showingDay(at)}, ${showingTime(at)}` : "This week";
                  return (
                    <li
                      key={event.id}
                      className="group motion-lift relative grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-card bg-surface-solid p-2 pr-3 shadow-[var(--shadow-card)] sm:grid-cols-[7rem_minmax(0,2fr)_8rem_minmax(0,1.3fr)_auto] sm:gap-6"
                    >
                      <div className="photo-zoom relative aspect-[4/3] overflow-hidden rounded-control bg-sand">
                        {image && <Photo photo={image} alt="" sizes="112px" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 leading-snug font-semibold tracking-tight sm:text-lg">
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
                        </h3>
                        <p className="mt-0.5 truncate text-meta text-text-muted sm:hidden">
                          {when}
                          {where && `, ${where}`}
                        </p>
                      </div>
                      <p className="hidden text-meta sm:block">
                        <span className="block font-semibold">
                          {timed ? showingDay(at) : "This week"}
                        </span>
                        {timed && <span className="text-text-muted">{showingTime(at)}</span>}
                      </p>
                      <p className="hidden min-w-0 items-center gap-2 text-meta sm:flex">
                        <Icon icon={MapPin} size={16} className="shrink-0 text-text-muted" />
                        <span className="truncate">{where}</span>
                      </p>
                      <div className="flex flex-col items-end gap-1">
                        {event.costBand === "free" && (
                          <span className="text-meta font-semibold text-free">Free</span>
                        )}
                        <CircleArrow className="text-text-muted group-hover:bg-ink group-hover:text-on-ink" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Container>
        </section>
      )}

      {/* Guides, read like a local paper. */}
      {guides.length > 0 && (
        <section aria-labelledby="guides-title" className="pt-20 sm:pt-28">
          <Container>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2
                  id="guides-title"
                  className="font-display text-section font-medium tracking-tight"
                >
                  Days out, written up
                </h2>
                <p className="mt-2 max-w-md text-body text-text-muted">
                  Short guides to a good day in each city, with every stop and what it costs.
                </p>
              </div>
              <PillLink href="/guides">All guides</PillLink>
            </div>
            <ul className="grid gap-x-12 gap-y-8 md:grid-cols-2">
              {guides.map((guide) => {
                const image = photoOf.get(guide.city);
                return (
                  <li key={guide.slug} className="group relative flex gap-5">
                    <div className="photo-zoom relative size-20 shrink-0 overflow-hidden rounded-full bg-sand ring-1 ring-divider sm:size-24">
                      {image && <Photo photo={image} alt="" sizes="96px" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-[0.08em] text-primary-text uppercase">
                        {cities.find((c) => c.slug === guide.city)?.name ?? "Guide"}
                      </p>
                      <h3 className="mt-1 text-card font-semibold tracking-tight">
                        <Link
                          href={`/guides/${guide.slug}` as Route}
                          className="group-hover:underline after:absolute after:inset-0"
                        >
                          {guide.title}
                        </Link>
                      </h3>
                      <p className="mt-1 line-clamp-2 text-meta text-text-muted">{guide.summary}</p>
                      <p className="mt-2 flex gap-4 text-meta font-semibold">
                        <span>{budgetLabel(guide.budget)}</span>
                        <span className="text-text-muted">{guide.stops.length} stops</span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Container>
        </section>
      )}

      {/* The planner, shown working. */}
      {day.stops.length > 0 && (
        <section aria-labelledby="planner-title" className="pt-20 sm:pt-28">
          <Container className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div className="flex flex-col items-center justify-center rounded-modal bg-deep px-6 py-12 text-center text-white sm:px-12 sm:py-16">
              <p className="rounded-full bg-white/10 px-3 py-1 text-meta font-semibold">
                Sample day
              </p>
              <h2
                id="planner-title"
                className="mt-6 max-w-lg font-display text-[clamp(1.6rem,1.3rem+1.3vw,2.4rem)] leading-tight font-medium tracking-tight"
              >
                A whole Saturday in {SAMPLE_CITY.name}, for about ${day.total}.
              </h2>
              <p className="mt-3 max-w-sm text-body text-white/80">
                Set a budget and get a full day out. Swap anything you like.
              </p>
              <ButtonLink
                href={`/planner?city=${SAMPLE_CITY.slug}`}
                variant="photo"
                className="mt-7"
              >
                Plan a day
                <Icon icon={ArrowRight} size={16} />
              </ButtonLink>
            </div>
            <div className="rounded-modal border border-divider bg-surface-solid p-3">
              <SamplePlan day={day} />
            </div>
          </Container>
        </section>
      )}

      <PhotoCredits
        photos={[
          ...collage.map((c) => ({ subject: c.name, photo: c.photo })),
          ...(featured ? [{ subject: featured.name, photo: featured.photo }] : []),
          ...(landscape ? [{ subject: "Lake Wilcox, Richmond Hill", photo: landscape }] : []),
          ...CATEGORIES.flatMap((c) => {
            const p = photo(`/categories/${c.slug}.jpg`);
            return p ? [{ subject: c.name, photo: p }] : [];
          }),
          ...guides.flatMap((g) => {
            const p = photoOf.get(g.city);
            return p ? [{ subject: g.title, photo: p }] : [];
          }),
        ]}
      />
    </>
  );
}

/** Attribution for every photo on the page, as their licences require. */
function PhotoCredits({ photos }: { photos: { subject: string; photo: PhotoInfo }[] }) {
  const seen = new Set<string>();
  const unique = photos.filter(({ photo: p }) => !seen.has(p.src) && seen.add(p.src));
  return (
    <Container className="pt-16">
      <details className="text-meta text-text-muted">
        <summary className="inline-flex min-h-6 cursor-pointer items-center hover:text-text">
          Photo credits
        </summary>
        <ul className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {unique.map(({ subject, photo: p }) => (
            <li key={p.src}>
              {subject}:{" "}
              <a href={p.credit.source} className="underline hover:text-text" rel="noopener">
                {p.credit.artist}
              </a>
              , {p.credit.license}
            </li>
          ))}
        </ul>
      </details>
    </Container>
  );
}

function Fact({ figure, label, note }: { figure: string; label: string; note: string }) {
  return (
    <li className="flex min-h-40 flex-col rounded-card p-4 card sm:min-h-44 sm:p-5">
      <p className="font-display text-[clamp(2rem,1.6rem+1.6vw,2.75rem)] leading-none font-medium tracking-tight">
        {figure}
      </p>
      <p className="mt-2 text-meta font-semibold">{label}</p>
      <p className="mt-auto pt-4 text-meta text-text-muted sm:pt-6">{note}</p>
    </li>
  );
}

/** One city print: its photo, its name, and a way in. */
function CityPrint({
  city,
  className,
  sizes,
  label,
}: {
  city: CityWithPhoto;
  className?: string;
  sizes: string;
  label?: string;
}) {
  return (
    <Link
      href={`/city/${city.slug}`}
      className={cn(
        "group motion-lift relative isolate flex flex-col justify-end overflow-hidden rounded-card bg-primary p-4 text-white hover:z-10",
        className,
      )}
    >
      <Photo
        photo={city.photo}
        alt=""
        sizes={sizes}
        className="-z-20 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
      />
      {label && <span className="text-meta font-semibold text-white/85">{label}</span>}
      <span className="flex items-end justify-between gap-3">
        <span className="font-display text-xl leading-tight font-medium sm:text-2xl">
          {city.name}
        </span>
        <CircleArrow className="border-white/50 bg-black/20 group-hover:bg-white group-hover:text-text" />
      </span>
    </Link>
  );
}

/** Three city photos, overlapping like prints on a table. */
function Collage({ cities }: { cities: CityWithPhoto[] }) {
  const [a, b, c] = cities;
  const lift = "shadow-[var(--shadow-lift)] ring-4 ring-surface-solid";
  return (
    <div className="relative grid grid-cols-2 gap-3 lg:block lg:h-[620px]">
      {a && (
        <CityPrint
          city={a}
          sizes="(min-width: 1024px) 340px, 100vw"
          className={cn(
            lift,
            "col-span-2 aspect-[16/10] lg:absolute lg:top-0 lg:right-0 lg:aspect-auto lg:h-[54%] lg:w-[54%]",
          )}
        />
      )}
      {b && (
        <CityPrint
          city={b}
          sizes="(min-width: 1024px) 330px, 50vw"
          className={cn(
            lift,
            "aspect-[4/5] lg:absolute lg:top-[40%] lg:left-0 lg:z-10 lg:aspect-auto lg:h-[44%] lg:w-[47%]",
          )}
        />
      )}
      {c && (
        <CityPrint
          city={c}
          sizes="(min-width: 1024px) 270px, 50vw"
          className={cn(
            lift,
            "aspect-[4/5] lg:absolute lg:right-0 lg:bottom-0 lg:aspect-auto lg:h-[36%] lg:w-[48%]",
          )}
        />
      )}
    </div>
  );
}

function FeaturedCity({ city }: { city: CityWithPhoto }) {
  return (
    <div className="flex flex-col">
      <CityPrint
        city={city}
        label="Today's city"
        sizes="(min-width: 1024px) 420px, 100vw"
        className="min-h-72 flex-1 p-5"
      />
      <p className="mt-2 text-meta text-text-muted">{city.tagline}</p>
    </div>
  );
}

/** A loose hand-drawn arrow from the words toward the photos. */
function HandArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 70c10-4 18-12 20-24 2-11-6-18-12-12-6 7 4 16 16 15 16-1 30-14 42-34" />
      <path d="M64 14l11 1 2 11" />
    </svg>
  );
}
