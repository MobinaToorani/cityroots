import { Check, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { CostBadge, PickBadge } from "@/components/ui/badges";
import { categoryColour } from "@/components/ui/category-icon";
import { Icon } from "@/components/ui/icon";
import { OpenBadge } from "@/components/features/open-badge";
import { PlaceLink } from "@/components/features/place-link";
import { SaveButton } from "@/components/features/save-button";
import type { PlaceCard } from "@/lib/data/types";
import type { CategorySlug } from "@/lib/domain/categories";
import { whereLine } from "@/lib/domain/where";

/** One line under a category's title: what is here, in plain words. */
export const CATEGORY_LEDES: Record<CategorySlug, string> = {
  physical: "Trails, pools, rinks, and drop-in sports, and what each one costs.",
  mental: "Libraries, gardens, and quiet rooms, and people to call for support.",
  social: "Community hubs, clubs, and drop-ins for meeting people.",
  financial: "Free help with taxes, transit fares, and everyday costs.",
  arts: "Galleries, museums, and studios, and what it costs to get in.",
  "dance-music": "Stages, studios, and choirs. Prices change, so check before you go.",
  food: "Markets, kitchens, and food programs.",
  cafes: "Coffee, and places to sit a while.",
  thrifting: "Thrift stores, vintage, and record shops, by neighbourhood.",
  volunteer: "Places that need a hand. Most roles need signing up ahead.",
  events: "Festivals, parades, and big days out.",
};

type LookProps = {
  places: readonly PlaceCard[];
  showCity: boolean;
  showPick: boolean;
  /** When each event happens, by place id. Only Festivals asks for these. */
  eventDates?: ReadonlyMap<string, string>;
};

function where(place: PlaceCard, showCity: boolean) {
  return whereLine(place.neighborhood, showCity ? place.cityName : null);
}

/** The name, as a link that covers its whole row or card. */
function Name({ place, className }: { place: PlaceCard; className?: string }) {
  return (
    <PlaceLink
      placeId={place.id}
      className={`group-hover:underline after:absolute after:inset-0 ${className ?? ""}`}
    >
      {place.name}
    </PlaceLink>
  );
}

function Save({ place }: { place: PlaceCard }) {
  return <SaveButton placeId={place.id} placeName={place.name} />;
}

function Facts({ place, showPick }: { place: PlaceCard; showPick: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <CostBadge band={place.costBand} />
      {place.weekly && <OpenBadge weekly={place.weekly} />}
      {showPick && place.isPick && <PickBadge />}
    </span>
  );
}

/** Get moving: signposts. A heavy coloured rule, then where it is before anything else. */
function Signposts({ places, showCity, showPick }: LookProps) {
  return (
    <ul className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
      {places.map((place) => (
        <li key={place.id}>
          <article className="group relative h-full border-t-4 border-[var(--cat)] pt-3 pr-11">
            <p className="text-meta font-semibold text-text-muted">
              {where(place, showCity) || place.cityName}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
              <Name place={place} />
            </h2>
            <p className="mt-1 line-clamp-2 text-meta text-text-muted">{place.summary}</p>
            <p className="mt-2">
              <Facts place={place} showPick={showPick} />
            </p>
            <div className="absolute top-2 right-0 z-10">
              <Save place={place} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

/** Calm and support: one quiet column with room around it, and the phone number within reach. */
function QuietColumn({ places, showCity }: LookProps) {
  return (
    <ul className="grid max-w-2xl gap-10">
      {places.map((place) => (
        <li key={place.id}>
          <article className="group relative pr-11">
            <h2 className="font-display text-section font-medium tracking-tight">
              <Name place={place} />
            </h2>
            <p className="mt-2 text-body text-text-muted">{place.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-meta">
              {place.phone && (
                <a
                  href={`tel:${place.phone.replace(/[^\d+]/g, "")}`}
                  className="touch-target relative z-10 inline-flex items-center gap-1.5 font-semibold text-primary-text quiet-link"
                >
                  <Icon icon={Phone} size={16} />
                  {place.phone}
                </a>
              )}
              {place.weekly && <OpenBadge weekly={place.weekly} />}
              {where(place, showCity) && (
                <span className="text-text-muted">{where(place, showCity)}</span>
              )}
            </div>
            <div className="absolute top-0 right-0 z-10">
              <Save place={place} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

/** Meet people: a notice board. Tinted sheets, with the first thing on offer called out. */
function NoticeBoard({ places, showCity, showPick }: LookProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {places.map((place) => (
        <li key={place.id}>
          <article className="group relative flex h-full flex-col rounded-card p-5 cat-tint">
            <h2 className="pr-9 font-display text-xl font-medium tracking-tight">
              <Name place={place} />
            </h2>
            {place.highlights[0] && (
              <p className="mt-2 text-body font-semibold">{place.highlights[0]}</p>
            )}
            <p className="mt-1 line-clamp-3 text-meta text-text">{place.summary}</p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 pt-4 text-meta">
              <span>{where(place, showCity)}</span>
              {showPick && place.isPick && <PickBadge />}
            </div>
            <div className="absolute top-2 right-2 z-10">
              <Save place={place} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

/** Money help: a directory. What you get comes first, because that is the question. */
function Directory({ places, showCity }: LookProps) {
  return (
    <ul className="divide-y divide-divider border-y border-divider">
      {places.map((place) => (
        <li key={place.id}>
          <article className="group relative grid gap-x-8 gap-y-1 py-4 pr-11 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="min-w-0">
              <p className="font-semibold text-[var(--cat)]">
                {place.highlights[0] ?? "Help with costs"}
              </p>
              <h2 className="mt-0.5 text-body font-semibold">
                <Name place={place} />
              </h2>
            </div>
            <div className="min-w-0 text-meta text-text-muted">
              <p>{place.summary}</p>
              <p className="mt-1">{where(place, showCity)}</p>
            </div>
            <div className="absolute top-3 right-0 z-10">
              <Save place={place} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

/** Arts and crafts: wall labels. Small, square, and set in the serif, as beside a painting. */
function WallLabels({ places, showCity, showPick }: LookProps) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {places.map((place) => (
        <li key={place.id}>
          <article className="group relative h-full border border-divider bg-surface-solid p-5 shadow-[var(--shadow-card)]">
            <h2 className="pr-8 font-display text-lg leading-snug font-medium italic">
              <Name place={place} />
            </h2>
            <p className="mt-1 text-meta font-semibold">
              {where(place, showCity) || place.cityName}
            </p>
            <p className="mt-3 line-clamp-3 text-meta text-text-muted">{place.summary}</p>
            <p className="mt-3">
              <Facts place={place} showPick={showPick} />
            </p>
            <div className="absolute top-2 right-2 z-10">
              <Save place={place} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

/** Music and dance: a lineup. The names are the page, set large and ruled off. */
function Lineup({ places, showCity }: LookProps) {
  return (
    <ul className="border-b border-divider">
      {places.map((place) => (
        <li key={place.id}>
          <article className="group relative grid items-baseline gap-x-6 border-t border-divider py-4 pr-11 md:grid-cols-[minmax(0,1fr)_16rem]">
            <h2 className="font-display text-[clamp(1.5rem,1.2rem+1.5vw,2.25rem)] leading-tight font-medium tracking-tight">
              <Name place={place} />
            </h2>
            <p className="mt-1 text-meta text-text-muted md:mt-0">
              {where(place, showCity)}
              {place.priceNote && <span className="block">{place.priceNote}</span>}
            </p>
            <div className="absolute top-3 right-0 z-10">
              <Save place={place} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

/** Food and markets: a menu. Name, dotted line, price; the description underneath. */
function Menu({ places, showCity }: LookProps) {
  return (
    <ul className="grid grid-cols-1 gap-x-12 gap-y-6 lg:grid-cols-2">
      {places.map((place) => (
        <li key={place.id}>
          <article className="group relative pr-11">
            <div className="flex items-baseline gap-2">
              <h2 className="min-w-0 font-display text-lg font-medium">
                <Name place={place} />
              </h2>
              <span
                aria-hidden="true"
                className="min-w-6 flex-1 translate-y-[-3px] border-b-2 border-dotted border-text-muted/50"
              />
              <CostBadge band={place.costBand} />
            </div>
            <p className="mt-1 text-meta text-text-muted">
              {place.summary}
              {where(place, showCity) && <em> {where(place, showCity)}.</em>}
            </p>
            <div className="absolute -top-1.5 right-0 z-10">
              <Save place={place} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

/** Cafes and hangouts: tips from a friend. The one thing worth knowing, in the serif. */
function CoffeeTips({ places, showCity }: LookProps) {
  return (
    <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
      {places.map((place) => (
        <li key={place.id}>
          <article className="group relative h-full border-b border-dashed border-divider py-4 pr-11">
            <h2 className="font-semibold tracking-tight">
              <Name place={place} />
            </h2>
            <p className="mt-0.5 line-clamp-2 font-display text-lg leading-snug text-[var(--cat)] italic">
              {place.highlights[0] ?? place.summary}
            </p>
            {where(place, showCity) && (
              <p className="mt-1 text-meta text-text-muted">{where(place, showCity)}</p>
            )}
            <div className="absolute top-3 right-0 z-10">
              <Save place={place} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

/** Thrift and vintage: a route. Grouped by neighbourhood, so you can visit a few at once. */
function ByNeighbourhood({ places, showCity }: LookProps) {
  const areas = new Map<string, PlaceCard[]>();
  for (const place of places) {
    const area = (showCity ? place.cityName : place.neighborhood) || "Around town";
    areas.set(area, [...(areas.get(area) ?? []), place]);
  }
  const ordered = [...areas].sort(([a], [b]) => a.localeCompare(b));
  return (
    <div className="grid grid-cols-1 items-start gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {ordered.map(([area, shops]) => (
        <section key={area}>
          <h2 className="border-b-2 border-[var(--cat)] pb-1 text-meta font-semibold text-[var(--cat)]">
            {area}
          </h2>
          <ul>
            {shops.map((place) => (
              <li key={place.id}>
                <article className="group relative flex min-h-11 items-center gap-2 border-b border-divider py-1 pr-11">
                  <div className="min-w-0">
                    <h3 className="font-semibold tracking-tight">
                      <Name place={place} />
                    </h3>
                    {place.costBand !== "free" && place.priceNote && (
                      <p className="text-meta text-text-muted">{place.priceNote}</p>
                    )}
                  </div>
                  <div className="absolute top-1/2 right-0 z-10 -translate-y-1/2">
                    <Save place={place} />
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Festivals: posters. A solid block of colour with the date and name on it. */
function Posters({ places, showCity, eventDates }: LookProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-3">
      {places.map((place) => (
        <li key={place.id}>
          <article className="group relative flex h-full flex-col overflow-hidden rounded-card card">
            <div className="flex min-h-36 flex-col justify-between gap-4 bg-[var(--cat)] p-5 text-bg">
              <p className="text-meta font-semibold">
                {eventDates?.get(place.id) ?? place.seasonNote ?? "Check for dates"}
              </p>
              <h2 className="font-display text-2xl leading-tight font-medium tracking-tight">
                <Name place={place} />
              </h2>
            </div>
            <div className="flex flex-1 items-start justify-between gap-3 p-4 pr-3">
              <p className="min-w-0 text-meta text-text-muted">{where(place, showCity)}</p>
              <div className="z-10 -mt-2">
                <Save place={place} />
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

/** Volunteer: what you would actually do. The listing's roles and limits, ticked off. */
function WhatYouWouldDo({ places, showCity }: LookProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {places.map((place) => (
        <li key={place.id}>
          <article className="group relative h-full rounded-card border-2 border-[var(--cat)] p-5">
            <h2 className="pr-9 text-lg font-semibold tracking-tight">
              <Name place={place} />
            </h2>
            <p className="mt-1 text-meta text-text-muted">{place.summary}</p>
            {place.highlights.length > 0 && (
              <ul className="mt-3 grid gap-1.5">
                {place.highlights.slice(0, 3).map((line) => (
                  <li key={line} className="flex gap-2 text-meta">
                    <Icon icon={Check} size={16} className="shrink-0 text-[var(--cat)]" />
                    {line}
                  </li>
                ))}
              </ul>
            )}
            {where(place, showCity) && (
              <p className="mt-3 text-meta text-text-muted">{where(place, showCity)}</p>
            )}
            <div className="absolute top-2 right-2 z-10">
              <Save place={place} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

const LOOKS: Record<CategorySlug, (props: LookProps) => ReactNode> = {
  physical: Signposts,
  mental: QuietColumn,
  social: NoticeBoard,
  financial: Directory,
  arts: WallLabels,
  "dance-music": Lineup,
  food: Menu,
  cafes: CoffeeTips,
  thrifting: ByNeighbourhood,
  volunteer: WhatYouWouldDo,
  events: Posters,
};

/** A single category's list, in the form that suits what people want from it. */
export function CategoryLook({ slug, ...props }: LookProps & { slug: CategorySlug }) {
  const Look = LOOKS[slug];
  return (
    <div data-look={slug} style={categoryColour(slug)}>
      <Look {...props} />
    </div>
  );
}
