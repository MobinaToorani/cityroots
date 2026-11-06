import { ArrowRight } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guidesForCity } from "@/content/guides";
import { CategoryTile } from "@/components/features/category-tile";
import { EventCard } from "@/components/features/event-card";
import { JsonLd } from "@/components/features/json-ld";
import { Photo, PhotoCredit } from "@/components/features/photo";
import { PlaceCard } from "@/components/features/place-card";
import { RememberCity } from "@/components/layout/city-picker";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container, SectionHeading } from "@/components/ui/section";
import { getCategoryCounts, getCityBySlug, listLiveCities } from "@/lib/data/cities";
import { listThisWeek } from "@/lib/data/events";
import { listPicks } from "@/lib/data/places";
import { showingDay } from "@/lib/domain/event-dates";
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

  const [picks, week, categoryCounts] = await Promise.all([
    listPicks(city.slug, 6),
    listThisWeek(8, city.slug),
    getCategoryCounts(city.id),
  ]);
  const hero = photo(city.heroImage);
  const guides = guidesForCity(city.slug);

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

      <RememberCity slug={city.slug} />
      <section
        aria-labelledby="city-title"
        className="relative isolate flex min-h-[min(50svh,460px)] items-end overflow-hidden bg-primary pt-16 pb-8 sm:pb-10"
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
              className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/40 to-black/10"
            />
          </>
        )}
        <Container>
          <h1
            id="city-title"
            className="font-display text-display font-medium tracking-tight text-white"
          >
            {city.name}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-white/90 sm:text-lg">{city.tagline}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={exploreHref({ city: city.slug, cost: ["free"] })}
              className="motion-press inline-flex h-11 items-center rounded-full bg-white px-5 font-semibold text-[#141412] transition-transform hover:-translate-y-0.5 active:translate-y-px"
            >
              {city.freeCount} free things
            </Link>
            <ButtonLink
              href={exploreHref({ city: city.slug })}
              variant="secondary"
              className="glass-strong"
            >
              See all {city.placeCount}
            </ButtonLink>
            <ButtonLink
              href={`/events?city=${city.slug}` as Route}
              variant="secondary"
              className="glass-strong"
            >
              What&apos;s on
            </ButtonLink>
          </div>
        </Container>
        {hero && <PhotoCredit photo={hero} className="absolute right-4 bottom-3 text-white/80" />}
      </section>

      {picks.length > 0 && (
        <section aria-labelledby="picks" className="pt-10">
          <Container>
            <SectionHeading id="picks" title="Start with these" className="mb-4" />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {picks.map((place) => (
                <li key={place.id}>
                  <PlaceCard place={place} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {week.length > 0 && (
        <section aria-labelledby="events-title" className="pt-12">
          <Container>
            <SectionHeading
              id="events-title"
              title="On this week"
              className="mb-4"
              action={
                <ButtonLink
                  href={`/events?city=${city.slug}` as Route}
                  variant="secondary"
                  size="sm"
                >
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
                  <EventCard
                    event={event}
                    when={timed ? showingDay(at) : "This week"}
                    showCity={false}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section aria-labelledby="categories" className="pt-12">
        <Container>
          <SectionHeading id="categories" title="Browse by type" className="mb-4" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {categoryCounts
              .filter((c) => c.count > 0)
              .map((c) => (
                <li key={c.slug}>
                  <CategoryTile
                    slug={c.slug}
                    count={c.count}
                    href={exploreHref({ city: city.slug, cat: [c.slug] })}
                  />
                </li>
              ))}
          </ul>
        </Container>
      </section>

      {guides.length > 0 && (
        <section aria-labelledby="city-guides" className="pt-12">
          <Container>
            <SectionHeading id="city-guides" title="Days already planned" className="mb-4" />
            <ul className="grid gap-2">
              {guides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}` as Route}
                    className="font-semibold text-primary-text quiet-link"
                  >
                    {guide.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}
