import { CalendarDays, Sparkles } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guidesForCity } from "@/content/guides";
import { CategoryTile } from "@/components/features/category-tile";
import { EventCard } from "@/components/features/event-card";
import { JsonLd } from "@/components/features/json-ld";
import { Photo, PhotoCredit } from "@/components/features/photo";
import { PlaceCard } from "@/components/features/place-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Container, SectionHeading } from "@/components/ui/section";
import { getCategoryCounts, getCityBySlug, listLiveCities } from "@/lib/data/cities";
import { listUpcomingFreeFirst } from "@/lib/data/events";
import { listPicks } from "@/lib/data/places";
import { firstSentence } from "@/lib/domain/copy";
import { exploreHref } from "@/lib/domain/explore-params";
import { photo } from "@/lib/photos";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const cities = await listLiveCities();
  return cities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/city/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const city = await getCityBySlug(slug);
  if (!city) return { title: "City not found" };
  const freeShare = city.placeCount ? Math.round((city.freeCount / city.placeCount) * 100) : 0;
  const description = `${city.placeCount} free and low-cost places, programs, and events in ${city.name}, ${freeShare}% of them free. ${city.tagline}.`;
  return {
    title: `Free things to do in ${city.name}`,
    description,
    alternates: { canonical: `/city/${city.slug}` },
    openGraph: {
      title: `Free things to do in ${city.name}`,
      description,
      url: `/city/${city.slug}`,
    },
  };
}

export default async function CityPage(props: PageProps<"/city/[slug]">) {
  const { slug } = await props.params;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const [picks, events, categoryCounts] = await Promise.all([
    listPicks(city.slug, 6),
    listUpcomingFreeFirst(city.slug, 8),
    getCategoryCounts(city.id),
  ]);
  const hero = photo(city.heroImage);
  const guides = guidesForCity(city.slug);
  const freeShare = city.placeCount ? Math.round((city.freeCount / city.placeCount) * 100) : 0;
  const note = city.curatorNote ?? city.description;
  const lead = firstSentence(note);
  const rest = note.slice(lead.length).trim();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "City",
          name: city.name,
          description: city.description,
          url: absoluteUrl(`/city/${city.slug}`),
          containedInPlace: { "@type": "AdministrativeArea", name: `${city.region}, Ontario` },
          geo: { "@type": "GeoCoordinates", latitude: city.lat, longitude: city.lng },
          ...(picks.length > 0 && {
            subjectOf: {
              "@type": "ItemList",
              name: `Start with these in ${city.name}`,
              itemListElement: picks.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(`/places/${p.id}`),
                name: p.name,
              })),
            },
          }),
        }}
      />

      <section
        aria-labelledby="city-title"
        className="relative isolate flex min-h-[72svh] items-end overflow-hidden bg-primary pt-28 pb-10 sm:pb-14"
      >
        {hero && (
          <>
            <Photo
              photo={hero}
              alt={`${city.name}, Ontario`}
              sizes="100vw"
              preload
              quality={60}
              className="-z-20"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/40 to-black/5"
            />
          </>
        )}
        <Container>
          <p className="mb-3 text-meta font-semibold text-white/90">{city.region}</p>
          <h1
            id="city-title"
            className="font-display text-display font-medium tracking-tight text-white"
          >
            {city.name}
          </h1>
          <p className="mt-3 max-w-xl text-lg text-white/90">{city.tagline}</p>
          <dl className="mt-6 flex flex-wrap gap-2">
            <div className="flex items-baseline gap-1.5 rounded-full px-4 py-2 glass-strong">
              <dt className="sr-only">Listings</dt>
              <dd>
                <span className="font-semibold">{city.placeCount}</span>{" "}
                <span className="text-meta text-text-muted">places</span>
              </dd>
            </div>
            <div className="flex items-baseline gap-1.5 rounded-full px-4 py-2 glass-strong">
              <dt className="sr-only">Share that is free</dt>
              <dd>
                <span className="font-semibold text-free">{freeShare}%</span>{" "}
                <span className="text-meta text-text-muted">free</span>
              </dd>
            </div>
          </dl>
        </Container>
        {hero && <PhotoCredit photo={hero} className="absolute right-4 bottom-3 text-white/80" />}
      </section>

      <Container className="grid gap-8 pt-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="text-meta font-semibold text-primary-text">From the curators</h2>
          <p className="mt-2 font-display text-[1.375rem] leading-snug">{lead}</p>
          {rest && <p className="mt-3 text-body text-text-muted">{rest}</p>}
        </div>
        <GlassCard className="self-start p-5">
          <h2 className="text-card font-semibold">Browse everything in {city.name}</h2>
          <p className="mt-1 text-body text-text-muted">
            Filter by cost, category, or type. Free listings always come first.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href={exploreHref({ city: city.slug, cost: ["free"] })} size="sm">
              Show free places
            </ButtonLink>
            <ButtonLink href={exploreHref({ city: city.slug })} variant="secondary" size="sm">
              Show all {city.placeCount}
            </ButtonLink>
          </div>
          {guides.length > 0 && (
            <div className="mt-5 border-t border-divider pt-4">
              <h3 className="text-meta font-semibold text-text-muted">A day already planned</h3>
              <ul className="mt-1 grid gap-1">
                {guides.map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={`/guides/${g.slug}` as Route}
                      className="font-semibold text-primary-text quiet-link"
                    >
                      {g.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </GlassCard>
      </Container>

      <section aria-labelledby="picks" className="pt-16">
        <Container>
          <SectionHeading
            id="picks"
            eyebrow="Curator picks"
            title="Start with these"
            description={`Good first visits in ${city.name}, chosen by people who live there.`}
          />
          {picks.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {picks.map((place) => (
                <li key={place.id}>
                  <PlaceCard place={place} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No picks here yet"
              action={
                <ButtonLink href={exploreHref({ city: city.slug })} size="sm">
                  Browse all of {city.name}
                </ButtonLink>
              }
            >
              Curators have not chosen favorites for {city.name} yet. Everything listed is still
              worth a look.
            </EmptyState>
          )}
        </Container>
      </section>

      <section aria-labelledby="categories" className="pt-16">
        <Container>
          <SectionHeading
            id="categories"
            eyebrow="By category"
            title={`What ${city.name} has`}
            description="Each tile opens the explorer already filtered."
          />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {categoryCounts
              .filter((c) => c.count > 0)
              .map((c) => (
                <li key={c.slug}>
                  <CategoryTile
                    slug={c.slug}
                    count={c.count}
                    freeCount={c.freeCount}
                    href={exploreHref({ city: city.slug, cat: [c.slug] })}
                  />
                </li>
              ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="events" className="pt-16">
        <Container>
          <SectionHeading
            id="events"
            eyebrow="Coming up"
            title="Festivals and events"
            description="Festivals and markets on now or coming up, free ones first. Check each listing for exact dates."
            action={
              events.length > 0 ? (
                <ButtonLink href={`/events?city=${city.slug}`} variant="secondary" size="sm">
                  See the events calendar
                </ButtonLink>
              ) : undefined
            }
          />
          {events.length > 0 ? (
            <div className="-mx-5 no-scrollbar overflow-x-auto px-5 sm:-mx-8 sm:px-8">
              <ul className="flex w-max snap-x snap-mandatory gap-4 pb-4">
                {events.map((event) => (
                  <li key={event.id} className="w-[78vw] max-w-[320px] shrink-0 snap-start">
                    <EventCard event={event} showCity={false} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No events listed yet"
              action={
                <ButtonLink href="/explore" size="sm">
                  Look in other cities
                </ButtonLink>
              }
            >
              We have not added events for {city.name} yet.
            </EmptyState>
          )}
        </Container>
      </section>
    </>
  );
}
