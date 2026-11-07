import { ArrowLeft, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExplorerProvider } from "@/components/features/explorer/explorer-state";
import { FilterTray } from "@/components/features/explorer/filter-tray";
import { LoadMore } from "@/components/features/explorer/load-more";
import { MapPane } from "@/components/features/explorer/map-pane";
import { PendingRegion } from "@/components/features/explorer/pending-region";
import { CATEGORY_LEDES, CategoryLook } from "@/components/features/explorer/category-looks";
import { ResultsSheet } from "@/components/features/explorer/results-sheet";
import { ResultsToolbar, SurpriseLink } from "@/components/features/explorer/results-toolbar";
import { PlaceCard } from "@/components/features/place-card";
import { RememberCity } from "@/components/layout/city-picker";
import { ButtonLink } from "@/components/ui/button";
import { CATEGORY_ICONS, categoryColour } from "@/components/ui/category-icon";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { listLiveCities } from "@/lib/data/cities";
import { listEventDateLabels } from "@/lib/data/events";
import { listMapPoints, PAGE_SIZE, queryPlaces } from "@/lib/data/places";
import { cn } from "@/lib/cn";
import { categoryMeta } from "@/lib/domain/categories";
import {
  activeFilterCount,
  exploreHref,
  loadExploreState,
  normalizeExploreState,
} from "@/lib/domain/explore-params";

export async function generateMetadata(props: PageProps<"/explore">): Promise<Metadata> {
  const state = normalizeExploreState(await loadExploreState(props.searchParams));
  const cities = await listLiveCities();
  const city = cities.find((c) => c.slug === state.city);
  const where = city ? city.name : "the GTA and Waterloo Region";
  const filtered =
    activeFilterCount(state) > 0 ||
    state.sort !== "relevance" ||
    state.page > 1 ||
    state.view !== "list" ||
    state.bbox !== null;
  return {
    title: `Free and low-cost things to do in ${where}`,
    description: `Search and filter free and affordable places, programs, and events in ${where}. Free listings first.`,
    alternates: { canonical: exploreHref({ city: state.city }) },
    // Filtered variants are shareable but not separate pages for search engines.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ExplorePage(props: PageProps<"/explore">) {
  const state = normalizeExploreState(await loadExploreState(props.searchParams));
  const isMap = state.view === "map";
  const [cities, result, points] = await Promise.all([
    listLiveCities(),
    queryPlaces(state, { hideEvents: true }),
    isMap ? listMapPoints(state, { hideEvents: true }) : Promise.resolve([]),
  ]);
  const city = cities.find((c) => c.slug === state.city) ?? null;

  // A label on every card says nothing, and picks come first in the default order.
  const showPicks = result.items.some((p) => !p.isPick);

  // One category gets its own opening and its own form of list. A mix stays as cards.
  const single = state.cat.length === 1 ? state.cat[0] : undefined;
  const singleMeta = single ? categoryMeta(single) : null;
  const eventDates =
    single === "events" && !isMap
      ? await listEventDateLabels(result.items.map((p) => p.id))
      : undefined;
  const titleLead = singleMeta?.name ?? "Things to do";

  const header = (
    <h1 className="mb-4 page-title">{city ? `${titleLead} in ${city.name}` : titleLead}</h1>
  );

  // With only a search on, "fewer filters" is the wrong advice.
  const onlySearched = Boolean(state.q) && activeFilterCount({ ...state, q: "" }) === 0;

  const results = (
    <div id="results" tabIndex={-1} className="scroll-mt-20 outline-none">
      <ResultsToolbar total={result.total} />
      <PendingRegion className="mt-4">
        {result.items.length > 0 ? (
          <>
            {single && !isMap ? (
              <CategoryLook
                slug={single}
                places={result.items}
                showCity={!state.city}
                showPick={showPicks}
                eventDates={eventDates}
              />
            ) : (
              <ul
                className={cn(
                  "grid grid-cols-1 gap-3",
                  isMap
                    ? "min-[1800px]:grid-cols-2"
                    : "sm:auto-rows-fr sm:grid-cols-2 xl:grid-cols-3",
                )}
              >
                {result.items.map((place) => (
                  <li key={place.id}>
                    <PlaceCard
                      place={place}
                      showCity={!state.city}
                      showPick={showPicks}
                      headingLevel="h2"
                    />
                  </li>
                ))}
              </ul>
            )}
            {result.total > 1 && (
              <div className="mt-6 flex justify-center sm:hidden">
                <SurpriseLink />
              </div>
            )}
            {result.hasMore && (
              <LoadMore shown={result.items.length} total={result.total} pageSize={PAGE_SIZE} />
            )}
          </>
        ) : (
          <EmptyState
            icon={SearchX}
            title="Nothing matches yet"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {state.city && state.q && (
                  <ButtonLink href={exploreHref({ q: state.q, view: state.view })} size="sm">
                    Search all cities
                  </ButtonLink>
                )}
                <ButtonLink
                  href={exploreHref({ city: state.city, view: state.view })}
                  variant={state.city && state.q ? "secondary" : "primary"}
                  size="sm"
                >
                  Clear filters
                </ButtonLink>
              </div>
            }
          >
            {state.open ? "Most places do not list exact hours. " : ""}
            {onlySearched ? "Check the spelling or try a broader word" : "Try fewer filters"}
            {state.bbox ? " or zoom the map out" : ""}. Know a place that belongs here?{" "}
            <Link href="/submit" className="font-semibold text-primary-text quiet-link">
              Suggest it
            </Link>
            .
          </EmptyState>
        )}
      </PendingRegion>
    </div>
  );

  return (
    <ExplorerProvider>
      <RememberCity slug={state.city} clearWhenEmpty />
      {isMap ? (
        <div className="lg:page-frame lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-6 lg:px-8 lg:pt-8">
          <ResultsSheet>
            {header}
            <div className="relative z-20">
              <FilterTray total={result.total} />
            </div>
            <div className="mt-5">{results}</div>
          </ResultsSheet>
          {/* z-10: the footer's positioned links would otherwise paint over a fixed map. */}
          <div className="fixed inset-x-0 top-16 bottom-0 z-10 lg:sticky lg:top-22 lg:z-auto lg:h-[calc(100dvh-7rem)]">
            <MapPane points={points} />
          </div>
        </div>
      ) : (
        <>
          {single && singleMeta && (
            <div style={categoryColour(single)} className="cat-tint">
              <div className="page-frame flex items-start justify-between gap-6 py-8 sm:py-10">
                <div>
                  <Link
                    href={exploreHref({ city: state.city, view: state.view })}
                    className="touch-target relative inline-flex items-center gap-1.5 text-meta font-semibold quiet-link"
                  >
                    <Icon icon={ArrowLeft} size={16} />
                    All things to do
                  </Link>
                  <h1 className="mt-3 page-title">
                    {city ? `${titleLead} in ${city.name}` : titleLead}
                  </h1>
                  <p className="mt-2 text-body">{CATEGORY_LEDES[single]}</p>
                </div>
                <span
                  aria-hidden="true"
                  className="hidden shrink-0 text-[var(--cat)] sm:block [&_svg]:size-14"
                >
                  <Icon icon={CATEGORY_ICONS[single]} size={20} />
                </span>
              </div>
            </div>
          )}
          <div className={single ? "page-frame pt-5" : "page-frame page-top"}>
            {!single && header}
            {/* Above the result cards, so an open filter menu is never painted under them. */}
            <div className="relative z-20 mb-5">
              <FilterTray total={result.total} />
            </div>
            {results}
          </div>
        </>
      )}
    </ExplorerProvider>
  );
}
