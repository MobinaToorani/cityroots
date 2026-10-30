import { SearchX, X } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PlaceCard } from "@/components/features/place-card";
import { CountBadge } from "@/components/ui/badges";
import { ButtonLink } from "@/components/ui/button";
import { ChipLink } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Icon } from "@/components/ui/icon";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { listLiveCities } from "@/lib/data/cities";
import { PAGE_SIZE, queryPlaces } from "@/lib/data/places";
import { CATEGORIES } from "@/lib/domain/categories";
import { COST_BANDS, COST_LABELS } from "@/lib/domain/cost";
import {
  activeFilterCount,
  exploreHref,
  loadExploreState,
  normalizeExploreState,
  PLACE_KINDS,
  type ExploreState,
} from "@/lib/domain/explore-params";

const KIND_LABELS: Record<(typeof PLACE_KINDS)[number], string> = {
  place: "Places",
  event: "Events",
  program: "Programs",
  resource: "Resources",
};

const SORT_LABELS = { relevance: "Best match", cost: "Lowest cost", newest: "Newest" } as const;

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export async function generateMetadata(props: PageProps<"/explore">): Promise<Metadata> {
  const state = normalizeExploreState(await loadExploreState(props.searchParams));
  const cities = await listLiveCities();
  const city = cities.find((c) => c.slug === state.city);
  const where = city ? city.name : "the GTA and Waterloo Region";
  const filtered = activeFilterCount(state) > 0 || state.sort !== "relevance" || state.page > 1;
  return {
    title: `Explore free and low-cost things to do in ${where}`,
    description: `Search and filter free and affordable places, programs, and events in ${where}. Free listings first.`,
    alternates: { canonical: exploreHref({ city: state.city }) },
    // Filtered variants are shareable but not separate pages for search engines.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ExplorePage(props: PageProps<"/explore">) {
  const state = normalizeExploreState(await loadExploreState(props.searchParams));
  const [cities, result] = await Promise.all([listLiveCities(), queryPlaces(state)]);
  const city = cities.find((c) => c.slug === state.city) ?? null;
  const filters = activeFilterCount(state);
  const with_ = (patch: Partial<ExploreState>) => exploreHref({ ...state, page: 1, ...patch });
  const nextPage = state.page + 1;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-4 sm:px-8 lg:pt-8">
      <header className="mb-6">
        <h1 className="text-section font-semibold tracking-tight">
          {city ? `Explore ${city.name}` : "Explore every city"}
        </h1>
        <p className="mt-1 text-body text-text-muted">
          Free listings come first. Nobody pays to appear here.
        </p>
      </header>

      <GlassCard strength="strong" className="sticky top-3 z-30 mb-6 grid gap-3 p-3 sm:p-4">
        <form action="/explore" method="get" role="search" className="flex gap-2">
          {state.city && <input type="hidden" name="city" value={state.city} />}
          {state.cat.length > 0 && <input type="hidden" name="cat" value={state.cat.join(",")} />}
          {state.cost.length > 0 && (
            <input type="hidden" name="cost" value={state.cost.join(",")} />
          )}
          {state.type.length > 0 && (
            <input type="hidden" name="type" value={state.type.join(",")} />
          )}
          <label htmlFor="explore-q" className="sr-only">
            Search places
          </label>
          <input
            id="explore-q"
            name="q"
            type="search"
            defaultValue={state.q}
            placeholder="Search by name, neighborhood, or tag"
            className="h-11 min-w-0 flex-1 rounded-full border border-divider bg-surface-solid px-4 text-body outline-none placeholder:text-text-muted hover:border-text-muted"
          />
          <button
            type="submit"
            className="motion-press h-11 rounded-full bg-primary px-5 font-semibold text-white hover:bg-primary-hover active:translate-y-px"
          >
            Search
          </button>
        </form>

        <FilterRow label="City">
          <ChipLink href={with_({ city: null })} active={!state.city}>
            All cities
          </ChipLink>
          {cities.map((c) => (
            <ChipLink key={c.slug} href={with_({ city: c.slug })} active={state.city === c.slug}>
              {c.name}
            </ChipLink>
          ))}
        </FilterRow>

        <FilterRow label="Cost">
          {COST_BANDS.map((band) => (
            <ChipLink
              key={band}
              href={with_({ cost: toggle(state.cost, band) })}
              active={state.cost.includes(band)}
            >
              {COST_LABELS[band]}
            </ChipLink>
          ))}
          <span aria-hidden="true" className="mx-1 h-6 w-px self-center bg-divider" />
          {PLACE_KINDS.map((kind) => (
            <ChipLink
              key={kind}
              href={with_({ type: toggle(state.type, kind) })}
              active={state.type.includes(kind)}
            >
              {KIND_LABELS[kind]}
            </ChipLink>
          ))}
          <ChipLink href={with_({ picks: !state.picks })} active={state.picks}>
            Picks only
          </ChipLink>
        </FilterRow>

        <FilterRow label="Category">
          {CATEGORIES.map((c) => (
            <ChipLink
              key={c.slug}
              href={with_({ cat: toggle(state.cat, c.slug) })}
              active={state.cat.includes(c.slug)}
              accent={c.accent}
            >
              {c.shortName}
            </ChipLink>
          ))}
        </FilterRow>
      </GlassCard>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-body" role="status">
            <span className="font-semibold">{result.total}</span>{" "}
            {result.total === 1 ? "result" : "results"}
            {state.q && (
              <>
                {" "}
                for <span className="font-semibold">&ldquo;{state.q}&rdquo;</span>
              </>
            )}
          </p>
          {filters > 0 && (
            <ButtonLink
              href={exploreHref({ city: state.city })}
              variant="secondary"
              size="sm"
              scroll={false}
            >
              <Icon icon={X} size={16} />
              Clear filters
              <CountBadge count={filters} label={`${filters} active filters`} />
            </ButtonLink>
          )}
        </div>
        <SegmentedLinks
          label="Sort results"
          items={(Object.keys(SORT_LABELS) as (keyof typeof SORT_LABELS)[]).map((sort) => ({
            href: with_({ sort }),
            label: SORT_LABELS[sort],
            active: state.sort === sort,
          }))}
        />
      </div>

      {result.items.length > 0 ? (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((place) => (
              <li key={place.id}>
                <PlaceCard place={place} showCity={!state.city} headingLevel="h2" />
              </li>
            ))}
          </ul>
          {result.hasMore && (
            <form action="/explore" method="get" className="mt-8 flex justify-center">
              {Object.entries({
                city: state.city ?? "",
                cat: state.cat.join(","),
                cost: state.cost.join(","),
                type: state.type.join(","),
                q: state.q,
                sort: state.sort === "relevance" ? "" : state.sort,
                picks: state.picks ? "true" : "",
              })
                .filter(([, v]) => v)
                .map(([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ))}
              <input type="hidden" name="page" value={nextPage} />
              <button
                type="submit"
                className="motion-press h-11 rounded-full px-6 font-semibold glass hover:bg-surface-strong active:translate-y-px"
              >
                Show {Math.min(PAGE_SIZE, result.total - result.items.length)} more
              </button>
            </form>
          )}
        </>
      ) : (
        <EmptyState
          icon={SearchX}
          title="Nothing matches yet"
          action={
            <ButtonLink href={exploreHref({ city: state.city })} size="sm">
              Clear filters
            </ButtonLink>
          }
        >
          Try fewer filters or a broader search. Free listings in nearby cities might fit too.
        </EmptyState>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-1 no-scrollbar flex gap-2 overflow-x-auto px-1"
    >
      {children}
    </div>
  );
}
