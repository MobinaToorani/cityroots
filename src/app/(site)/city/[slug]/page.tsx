import { ArrowRight } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guidesForCity } from "@/content/guides";
import { CategoryTile } from "@/components/features/category-tile";
import { JsonLd } from "@/components/features/json-ld";
import { Photo, PhotoCredit } from "@/components/features/photo";
import { PlaceCard } from "@/components/features/place-card";
import { WeekList } from "@/components/features/week-list";
import { RememberCity } from "@/components/layout/city-picker";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container, PageSection } from "@/components/ui/section";
import { getCategoryCounts, getCityBySlug, listLiveCities } from "@/lib/data/cities";
import { listThisWeek } from "@/lib/data/events";
import { listPicks } from "@/lib/data/places";
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

  const [allPicks, week, categoryCounts] = await Promise.all([
    listPicks(city.slug, 6),
    listThisWeek(8, city.slug),
    getCategoryCounts(city.id),
  ]);
  // Six or three, so the three-column grid never ends on a gap.
  const picks = allPicks.slice(0, allPicks.length >= 6 ? 6 : allPicks.length >= 3 ? 3 : undefined);
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
            <ButtonLink href={exploreHref({ city: city.slug, cost: ["free"] })} variant="photo">
              {city.browseFreeCount} free places
            </ButtonLink>
            <ButtonLink href={exploreHref({ city: city.slug })} variant="photo-outline">
              See all {city.browseCount}
            </ButtonLink>
            <ButtonLink href={`/events?city=${city.slug}` as Route} variant="photo-outline">
              What&apos;s on
            </ButtonLink>
          </div>
        </Container>
        {hero && <PhotoCredit photo={hero} className="absolute right-4 bottom-3 text-white/80" />}
      </section>

      {picks.length > 0 && (
        <PageSection id="picks" title="Start with these">
          <ul className="grid grid-cols-1 gap-3 sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((place) => (
              <li key={place.id}>
                <PlaceCard place={place} showPick={false} />
              </li>
            ))}
          </ul>
        </PageSection>
      )}

      {week.length > 0 && (
        <PageSection
          id="events-title"
          title="On this week"
          action={
            <ButtonLink
              href={`/events?city=${city.slug}` as Route}
              variant="quiet"
              className="text-meta"
            >
              See what&apos;s on
              <Icon icon={ArrowRight} size={16} />
            </ButtonLink>
          }
        >
          <WeekList items={week} showCity={false} />
        </PageSection>
      )}

      <PageSection id="categories" title="What are you up for?">
        <ul className="grid grid-cols-2 gap-x-6 lg:grid-cols-5">
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
      </PageSection>

      {guides.length > 0 && (
        <PageSection id="city-guides" title="Guides">
          <ul className="grid grid-cols-1 gap-x-12 lg:grid-cols-2">
            {guides.map((guide) => (
              <li key={guide.slug} className="group relative border-t border-divider py-3">
                <h3 className="font-semibold tracking-tight">
                  <Link
                    href={`/guides/${guide.slug}` as Route}
                    className="group-hover:underline after:absolute after:inset-0"
                  >
                    {guide.title}
                  </Link>
                </h3>
                <p className="mt-0.5 text-meta text-text-muted">{guide.summary}</p>
              </li>
            ))}
          </ul>
        </PageSection>
      )}
    </>
  );
}
