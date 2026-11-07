import { CalendarDays, Wallet } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { GUIDES, getGuide, loadGuideBody } from "@/content/guides";
import { GuideStop } from "@/components/features/guides/guide-stop";
import { JsonLd } from "@/components/features/json-ld";
import { Photo, PhotoCredit } from "@/components/features/photo";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/section";
import { getCityBySlug } from "@/lib/data/cities";
import { getGuideStops, type GuideStop as GuideStopData } from "@/lib/data/places";
import { SEASON_LABELS, budgetLabel, type GuideMeta } from "@/lib/domain/guides";
import { exploreHref } from "@/lib/domain/explore-params";
import { photo } from "@/lib/photos";
import { absoluteUrl } from "@/lib/site";

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata(props: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const guide = getGuide((await props.params).slug);
  if (!guide) return { title: "Guide not found" };
  return {
    title: guide.title,
    description: guide.summary,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.summary,
      url: `/guides/${guide.slug}`,
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
    },
  };
}

/** Binds `<Stop slug>` in the MDX body to this guide's loaded listings. */
function stopComponent(guide: GuideMeta, stops: Map<string, GuideStopData>) {
  return function Stop({ slug, children }: { slug: string; children: ReactNode }) {
    const stop = stops.get(slug);
    if (!stop) throw new Error(`Guide ${guide.slug} has a stop not in its metadata: ${slug}`);
    return (
      <GuideStop stop={stop} position={guide.stops.indexOf(slug) + 1}>
        {children}
      </GuideStop>
    );
  };
}

const dateFormat = new Intl.DateTimeFormat("en-CA", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function GuidePage(props: PageProps<"/guides/[slug]">) {
  const guide = getGuide((await props.params).slug);
  if (!guide) notFound();
  const [city, stops, Body] = await Promise.all([
    getCityBySlug(guide.city),
    getGuideStops(guide.city, guide.stops),
    loadGuideBody(guide.slug),
  ]);
  if (!city) notFound();
  // A guide that names a listing which no longer exists fails the build rather than shipping a gap.
  const missing = guide.stops.filter((s) => !stops.has(s));
  if (missing.length > 0) {
    throw new Error(`Guide ${guide.slug} names missing places: ${missing.join(", ")}`);
  }
  const hero = photo(city.heroImage);

  const Stop = stopComponent(guide, stops);

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.summary,
          datePublished: guide.publishedAt,
          dateModified: guide.updatedAt,
          author: { "@type": "Organization", name: "CityRoots" },
          url: absoluteUrl(`/guides/${guide.slug}`),
          about: {
            "@type": "ItemList",
            itemListElement: guide.stops.map((slug, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: stops.get(slug)?.name,
              url: absoluteUrl(`/places/${stops.get(slug)?.id}`),
            })),
          },
        }}
      />
      <header className="relative isolate flex min-h-[56svh] items-end overflow-hidden bg-primary pt-28 pb-10">
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
              className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/45 to-black/10"
            />
          </>
        )}
        <Container className="reading">
          <p className="mb-3 text-meta font-semibold text-white/90">
            <Link href="/guides" className="quiet-link">
              Guides
            </Link>{" "}
            / {city.name}
          </p>
          <h1 className="font-display text-display font-medium tracking-tight text-white">
            {guide.title}
          </h1>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
            <li className="inline-flex items-center gap-1.5 text-meta font-semibold text-white">
              <Icon icon={Wallet} size={16} />
              {budgetLabel(guide.budget)}
            </li>
            <li className="inline-flex items-center gap-1.5 text-meta font-semibold text-white">
              <Icon icon={CalendarDays} size={16} />
              {SEASON_LABELS[guide.season]}
            </li>
          </ul>
        </Container>
        {hero && <PhotoCredit photo={hero} className="absolute right-4 bottom-3 text-white/80" />}
      </header>

      <Container className="reading pt-8">
        <p className="text-meta text-text-muted">
          By CityRoots curators. Updated{" "}
          <time dateTime={guide.updatedAt}>{dateFormat.format(new Date(guide.updatedAt))}</time>.
          Hours and prices come from each listing.
        </p>
        <div className="mt-2">
          <Body components={{ Stop }} />
        </div>

        <section aria-labelledby="next" className="mt-16 rounded-card p-6 card">
          <h2 id="next" className="text-card font-semibold">
            Keep going in {city.name}
          </h2>
          <p className="mt-2 text-body text-text-muted">
            {city.freeCount} of {city.placeCount} listings in {city.name} are free. Every one was
            added and checked by people who live nearby.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href={exploreHref({ city: city.slug, cost: ["free"] })} size="sm">
              Find free things in {city.name}
            </ButtonLink>
            <ButtonLink href={"/guides" as Route} variant="secondary" size="sm">
              Read another guide
            </ButtonLink>
          </div>
        </section>
      </Container>
    </article>
  );
}
