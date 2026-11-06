import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExplorerProvider } from "@/components/features/explorer/explorer-state";
import { FilterTray } from "@/components/features/explorer/filter-tray";
import { LoadMore } from "@/components/features/explorer/load-more";
import { MapPane } from "@/components/features/explorer/map-pane";
import { PendingRegion } from "@/components/features/explorer/pending-region";
import { ResultsSheet } from "@/components/features/explorer/results-sheet";
import { ResultsToolbar } from "@/components/features/explorer/results-toolbar";
import { PlaceCard } from "@/components/features/place-card";
import { RememberCity } from "@/components/layout/city-picker";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listLiveCities } from "@/lib/data/cities";
import { listMapPoints, PAGE_SIZE, queryPlaces } from "@/lib/data/places";
import { cn } from "@/lib/cn";
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

  const header = (
    <h1 className="mb-4 text-section font-semibold tracking-tight">
      {city ? `Things to do in ${city.name}` : "Things to do"}
    </h1>
  );

  const results = (
    <div id="results" tabIndex={-1} className="scroll-mt-20 outline-none">
      <ResultsToolbar total={result.total} />
      <PendingRegion className="mt-4">
        {result.items.length > 0 ? (
          <>
            <ul
              className={cn(
                "grid gap-3",
                isMap ? "min-[1800px]:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3",
              )}
            >
              {result.items.map((place) => (
                <li key={place.id}>
                  <PlaceCard place={place} showCity={!state.city} headingLevel="h2" />
                </li>
              ))}
            </ul>
            {result.hasMore && (
              <LoadMore remaining={result.total - result.items.length} pageSize={PAGE_SIZE} />
            )}
          </>
        ) : (
          <EmptyState
            icon={SearchX}
            title="Nothing matches yet"
            action={
              <ButtonLink href={exploreHref({ city: state.city, view: state.view })} size="sm">
                Clear filters
              </ButtonLink>
            }
          >
            {state.open ? "Most places do not list exact hours. " : ""}
            Try fewer filters{state.bbox ? " or zoom the map out" : ""}. Know a place that belongs
            here?{" "}
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
        <div className="mx-auto max-w-[1600px] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-6 lg:px-6 lg:pt-6">
          <ResultsSheet>
            {header}
            <div className="relative z-20">
              <FilterTray />
            </div>
            <div className="mt-5">{results}</div>
          </ResultsSheet>
          <div className="fixed inset-x-0 top-16 bottom-0 z-0 lg:sticky lg:top-22 lg:z-auto lg:h-[calc(100dvh-7rem)]">
            <MapPane points={points} />
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6">
          {header}
          {/* Above the result cards, so an open filter menu is never painted under them. */}
          <div className="relative z-20 mb-5">
            <FilterTray />
          </div>
          {results}
        </div>
      )}
    </ExplorerProvider>
  );
}
