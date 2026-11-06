import {
  BadgeCheck,
  Store,
  Accessibility,
  ArrowLeft,
  CalendarClock,
  Navigation,
  Clock,
  ExternalLink,
  Lightbulb,
  MapPin,
  PencilLine,
  Phone,
} from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AddToCollection } from "@/components/features/add-to-collection";
import { JsonLd } from "@/components/features/json-ld";
import { OpenNow } from "@/components/features/open-now";
import { PlaceCard } from "@/components/features/place-card";
import { SaveButton } from "@/components/features/save-button";
import { ShareButton } from "@/components/features/share-button";
import { CostBadge, PickBadge } from "@/components/ui/badges";
import { buttonClasses } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { getPlace, listPrerenderedPlaceIds, listSimilarPlaces } from "@/lib/data/places";
import type { PlaceDetail } from "@/lib/data/types";
import { categoryMeta } from "@/lib/domain/categories";
import { COST_HINTS, COST_LABELS } from "@/lib/domain/cost";
import { exploreHref } from "@/lib/domain/explore-params";
import { features } from "@/lib/env";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  return listPrerenderedPlaceIds();
}

export async function generateMetadata(props: PageProps<"/places/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const place = await getPlace(id);
  if (!place) return { title: "Place not found" };
  const title = `${place.name}, ${place.cityName}`;
  const description = `${COST_LABELS[place.costBand]}. ${place.summary}`;
  return {
    title,
    description,
    alternates: { canonical: `/places/${place.id}` },
    openGraph: { title, description, url: `/places/${place.id}` },
  };
}

function schemaType(place: PlaceDetail): string {
  if (["cafes", "food", "thrifting"].includes(place.category) && place.kind === "place") {
    return "LocalBusiness";
  }
  return "TouristAttraction";
}

function mapsUrl(place: PlaceDetail): string {
  const query =
    place.lat && place.lng
      ? `${place.lat},${place.lng}`
      : `${place.name}, ${place.address ?? place.cityName}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export default async function PlacePage(props: PageProps<"/places/[id]">) {
  const { id } = await props.params;
  const place = await getPlace(id);
  if (!place) notFound();
  const similar = await listSimilarPlaces(place, 3);
  const category = categoryMeta(place.category);
  const a11y = place.accessibility;

  return (
    <article className="mx-auto max-w-[1100px] px-5 pt-4 sm:px-8 lg:pt-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": schemaType(place),
          name: place.name,
          description: place.description,
          url: absoluteUrl(`/places/${place.id}`),
          isAccessibleForFree: place.costBand === "free",
          ...(place.address && {
            address: {
              "@type": "PostalAddress",
              streetAddress: place.address,
              addressLocality: place.cityName,
              addressRegion: "ON",
              addressCountry: "CA",
            },
          }),
          ...(place.lat &&
            place.lng && {
              geo: { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng },
            }),
          ...(place.sourceUrl && { sameAs: place.sourceUrl }),
          ...(place.phone && { telephone: place.phone }),
        }}
      />

      <Link
        href={exploreHref({ city: place.citySlug })}
        className="mb-5 inline-flex items-center gap-1.5 text-meta font-semibold text-text-muted quiet-link"
      >
        <Icon icon={ArrowLeft} size={16} />
        Everything in {place.cityName}
      </Link>

      <header>
        <div className="flex items-start gap-4">
          <CategoryIcon slug={place.category} className="size-12 [&_svg]:size-6" />
          <div className="min-w-0">
            <p className="text-meta text-text-muted">
              {category.name}
              {place.neighborhood ? `, ${place.neighborhood}` : ""}
            </p>
            <h1 className="font-display text-[clamp(1.75rem,1.4rem+1.6vw,2.5rem)] leading-tight font-medium tracking-tight">
              {place.name}
            </h1>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <CostBadge band={place.costBand} className="h-7 px-3 text-body" />
          <span className="text-body">{place.priceNote ?? COST_HINTS[place.costBand]}</span>
          {place.isPick && <PickBadge />}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {place.lat && place.lng ? (
            <a
              href={mapsUrl(place)}
              target="_blank"
              rel="noopener"
              className={buttonClasses("primary")}
            >
              <Icon icon={Navigation} size={16} />
              Directions
            </a>
          ) : null}
          {place.sourceUrl && (
            <a
              href={place.sourceUrl}
              target="_blank"
              rel="noopener"
              className={buttonClasses(place.lat && place.lng ? "secondary" : "primary")}
            >
              Website
              <Icon icon={ExternalLink} size={16} />
            </a>
          )}
          <SaveButton placeId={place.id} placeName={place.name} variant="full" />
          <ShareButton title={place.name} />
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="grid gap-8">
          <section aria-labelledby="about-place">
            <h2 id="about-place" className="text-card font-semibold">
              About
            </h2>
            <p className="mt-2 text-body">{place.description}</p>
            {place.highlights.length > 0 && (
              <ul className="mt-4 grid gap-2">
                {place.highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-body">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                    />
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {place.curatorNote && (
            <Card as="section" aria-labelledby="why-go" className="p-5">
              <h2 id="why-go" className="flex items-center gap-2 text-card font-semibold">
                <Icon icon={Lightbulb} className="text-pick" />
                Why go
              </h2>
              <p className="mt-2 text-body">{place.curatorNote}</p>
            </Card>
          )}

          <section aria-labelledby="tips">
            <h2 id="tips" className="text-card font-semibold">
              Tips from the community
            </h2>
            {place.tips.length > 0 ? (
              <ul className="mt-3 grid gap-3">
                {place.tips.map((tip) => (
                  <li key={tip.id}>
                    <Card className="p-4 text-body">{tip.body}</Card>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-body text-text-muted">No tips yet.</p>
            )}
          </section>
        </div>

        <aside aria-label="Details" className="grid content-start gap-4">
          <Card className="grid gap-4 p-5">
            {(place.address || place.neighborhood) && (
              <Detail icon={MapPin} label="Where">
                {place.neighborhood && (
                  <span className="block font-semibold">{place.neighborhood}</span>
                )}
                {place.address && <span className="block text-text-muted">{place.address}</span>}
              </Detail>
            )}
            {place.hours && (
              <Detail icon={Clock} label="Hours">
                {place.hours.weekly && <OpenNow weekly={place.hours.weekly} />}
                {place.hours.text}
              </Detail>
            )}
            {place.seasonNote && (
              <Detail icon={CalendarClock} label="Season">
                {place.seasonNote}
              </Detail>
            )}
            {place.phone && (
              <Detail icon={Phone} label="Phone">
                <a href={`tel:${place.phone.replace(/[^\d+]/g, "")}`} className="quiet-link">
                  {place.phone}
                </a>
              </Detail>
            )}
            <Detail icon={Accessibility} label="Accessibility">
              {a11y && Object.keys(a11y).length > 0 ? (
                <ul className="grid gap-0.5">
                  {a11y.stepFree !== undefined && (
                    <li>{a11y.stepFree ? "Step-free entrance" : "Has steps at the entrance"}</li>
                  )}
                  {a11y.accessibleWashroom && <li>Accessible washroom</li>}
                  {a11y.parking && <li>Accessible parking</li>}
                  {a11y.transitNearby && <li>Transit nearby</li>}
                  {a11y.notes && <li>{a11y.notes}</li>}
                </ul>
              ) : (
                <span className="text-text-muted">Not confirmed yet. Call ahead.</span>
              )}
            </Detail>
          </Card>
          {place.lastVerifiedAt && (
            <p className="text-meta text-text-muted">
              Details checked {formatDate(place.lastVerifiedAt)}.
            </p>
          )}
          {place.ownerConfirmed && (
            <p className="inline-flex items-center gap-1.5 text-meta text-text-muted">
              <Icon icon={BadgeCheck} size={16} />
              Details confirmed by the people who run it.
            </p>
          )}
          <AddToCollection placeId={place.id} placeName={place.name} />
          <Link
            href={`/submit?type=correction&place=${place.id}`}
            className="inline-flex items-center gap-1.5 text-meta font-semibold text-primary-text quiet-link"
          >
            <Icon icon={PencilLine} size={16} />
            Suggest a correction
          </Link>
          {features.business() && !place.ownerConfirmed && (
            <Link
              href={`/business/claim/${place.id}` as Route}
              className="inline-flex items-center gap-1.5 text-meta font-semibold text-primary-text quiet-link"
            >
              <Icon icon={Store} size={16} />
              Run this place? Claim it
            </Link>
          )}
        </aside>
      </div>

      <section aria-labelledby="similar" className="mt-14 scroll-mt-6">
        <h2 id="similar" className="text-card font-semibold tracking-tight">
          More like this in {place.cityName}
        </h2>
        {similar.length > 0 ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <li key={p.id}>
                <PlaceCard place={p} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-body text-text-muted">
            This is the only one so far.{" "}
            <Link
              href={exploreHref({ city: place.citySlug })}
              className="text-primary-text quiet-link"
            >
              Browse everything in {place.cityName}
            </Link>
            .
          </p>
        )}
      </section>
    </article>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[20px_1fr] gap-3 text-body">
      <Icon icon={icon} className="mt-0.5 text-text-muted" />
      <div>
        <h3 className="text-meta font-semibold text-text-muted">{label}</h3>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}
