"use client";

import { useReducer, useMemo, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import Fuse from "fuse.js";
import { CityGuide, FilterState, Category, CostLevel, PlaceType, Place, defaultFilters } from "@/lib/types";
import { createSearch } from "@/lib/search";
import { useFilteredPlaces } from "@/hooks/useFilteredPlaces";
import { PlaceCard } from "@/components/PlaceCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { CostFilter } from "@/components/CostFilter";
import { TypeFilter } from "@/components/TypeFilter";
import { SearchBar } from "@/components/SearchBar";
import { ActiveFilters } from "@/components/ActiveFilters";
import { ViewToggle } from "@/components/ViewToggle";
import { WellbeingWheel } from "@/components/WellbeingWheel";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { TreePine, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const MapView = dynamic(() => import("@/components/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
      <p className="text-sm text-zinc-400">Loading map...</p>
    </div>
  ),
});

type FilterAction =
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_CATEGORY"; value: Category | "all" }
  | { type: "SET_COST"; value: CostLevel | "all" }
  | { type: "SET_TYPE"; value: PlaceType | "all" }
  | { type: "SET_VIEW"; value: "grid" | "list" | "map" }
  | { type: "REMOVE"; key: keyof FilterState }
  | { type: "RESET" };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_SEARCH": return { ...state, search: action.value };
    case "SET_CATEGORY": return { ...state, category: action.value };
    case "SET_COST": return { ...state, cost: action.value };
    case "SET_TYPE": return { ...state, type: action.value };
    case "SET_VIEW": return { ...state, view: action.value };
    case "REMOVE":
      if (action.key === "category") return { ...state, category: "all" };
      if (action.key === "cost") return { ...state, cost: "all" };
      if (action.key === "type") return { ...state, type: "all" };
      if (action.key === "showRecommendedOnly") return { ...state, showRecommendedOnly: false };
      return state;
    case "RESET": return defaultFilters;
    default: return state;
  }
}

function filtersToParams(filters: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.category !== "all") p.set("category", filters.category);
  if (filters.cost !== "all") p.set("cost", filters.cost);
  if (filters.type !== "all") p.set("type", filters.type);
  if (filters.search) p.set("q", filters.search);
  if (filters.view !== "grid") p.set("view", filters.view);
  return p;
}

function applyNonCategoryFilters(places: Place[], filters: FilterState, fuse: Fuse<Place>): Place[] {
  let result: Place[];
  if (filters.search.trim()) {
    result = fuse.search(filters.search.trim()).map((r) => r.item);
  } else {
    result = places;
  }
  if (filters.cost !== "all") result = result.filter((p) => p.cost === filters.cost);
  if (filters.type !== "all") result = result.filter((p) => p.type === filters.type);
  if (filters.showRecommendedOnly) result = result.filter((p) => p.isRecommended);
  return result;
}

interface CityGuideClientProps {
  city: CityGuide;
}

export function CityGuideClient({ city }: CityGuideClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const [showSecondaryFilters, setShowSecondaryFilters] = useState(false);

  const initialFilters: FilterState = useMemo(() => ({
    ...defaultFilters,
    category: (searchParams.get("category") as Category | "all") ?? "all",
    cost: (searchParams.get("cost") as CostLevel | "all") ?? "all",
    type: (searchParams.get("type") as PlaceType | "all") ?? "all",
    search: searchParams.get("q") ?? "",
    view: (searchParams.get("view") as "grid" | "list" | "map") ?? "grid",
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [filters, dispatch] = useReducer(filterReducer, initialFilters);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = filtersToParams(filters);
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [filters, pathname, router]);

  const fuse = useMemo(() => createSearch(city.places), [city.places]);
  const filtered = useFilteredPlaces(city.places, filters, fuse);

  // Category counts respect all active filters except category itself
  const categoryCounts = useMemo(() => {
    const base = applyNonCategoryFilters(city.places, filters, fuse);
    const counts: Partial<Record<Category | "all", number>> = {};
    counts.all = base.length;
    base.forEach((p) => {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    });
    return counts;
  }, [city.places, filters, fuse]);

  // Cost counts respect all active filters except cost itself
  const costCounts = useMemo(() => {
    let base: Place[];
    if (filters.search.trim()) {
      base = fuse.search(filters.search.trim()).map((r) => r.item);
    } else {
      base = city.places;
    }
    if (filters.category !== "all") base = base.filter((p) => p.category === filters.category);
    if (filters.type !== "all") base = base.filter((p) => p.type === filters.type);
    if (filters.showRecommendedOnly) base = base.filter((p) => p.isRecommended);
    const counts: Partial<Record<string, number>> = {};
    base.forEach((p) => {
      counts[p.cost] = (counts[p.cost] ?? 0) + 1;
    });
    return counts as Partial<Record<import("@/lib/types").CostLevel | "all", number>>;
  }, [city.places, filters, fuse]);

  // Type counts respect all active filters except type itself
  const typeCounts = useMemo(() => {
    let base: Place[];
    if (filters.search.trim()) {
      base = fuse.search(filters.search.trim()).map((r) => r.item);
    } else {
      base = city.places;
    }
    if (filters.category !== "all") base = base.filter((p) => p.category === filters.category);
    if (filters.cost !== "all") base = base.filter((p) => p.cost === filters.cost);
    if (filters.showRecommendedOnly) base = base.filter((p) => p.isRecommended);
    const counts: Partial<Record<PlaceType | "all", number>> = {};
    counts.all = base.length;
    base.forEach((p) => {
      counts[p.type] = (counts[p.type] ?? 0) + 1;
    });
    return counts;
  }, [city.places, filters, fuse]);

  const handleRemoveFilter = useCallback((key: keyof FilterState) => {
    dispatch({ type: "REMOVE", key });
  }, []);

  const hasActiveFilters =
    filters.category !== "all" ||
    filters.cost !== "all" ||
    filters.type !== "all" ||
    filters.showRecommendedOnly;

  const secondaryFilterCount =
    (filters.cost !== "all" ? 1 : 0) + (filters.type !== "all" ? 1 : 0);

  return (
    <div>
      {/* City header */}
      <div className="bg-white border-b border-zinc-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-10">
            {/* Left: city info */}
            <div className="flex-1 min-w-0">
              <nav className="text-xs text-zinc-400 mb-4 flex items-center gap-1.5">
                <Link href="/" className="hover:text-zinc-600 transition-colors">Home</Link>
                <span className="text-zinc-200">/</span>
                <Link href="/explore" className="hover:text-zinc-600 transition-colors">Cities</Link>
                <span className="text-zinc-200">/</span>
                <span className="text-zinc-500">{city.cityName}</span>
              </nav>
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{city.cityName}</h1>
              <p className="text-zinc-400 mt-1 text-sm">{city.province}, {city.country}</p>
              {city.heroDescription && (
                <p className="text-zinc-500 mt-3 text-sm leading-relaxed max-w-xl">
                  {city.heroDescription}
                </p>
              )}
              <div className="flex items-center gap-2 mt-5">
                <span className="text-xs bg-zinc-50 border border-zinc-200 text-zinc-600 px-2.5 py-1 rounded-full">
                  {city.places.length} places
                </span>
                <span className="text-xs bg-green-50 border border-green-100 text-green-700 px-2.5 py-1 rounded-full">
                  {city.places.filter((p) => p.isFree).length} free
                </span>
                <span className="text-xs bg-zinc-50 border border-zinc-200 text-zinc-600 px-2.5 py-1 rounded-full">
                  {new Set(city.places.map((p) => p.category)).size} categories
                </span>
              </div>
            </div>

            {/* Right: wellbeing wheel — desktop only */}
            <div className="hidden lg:block shrink-0 pt-2">
              <WellbeingWheel
                counts={categoryCounts as Partial<Record<Category, number>>}
                activeCategory={filters.category}
                onSelect={(cat) => dispatch({ type: "SET_CATEGORY", value: cat })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-14 z-40 bg-white/95 backdrop-blur border-b border-zinc-200 py-3">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-2.5">
          {/* Row 1: Search + View + mobile Filters toggle */}
          <div className="flex items-center gap-2">
            <SearchBar
              value={filters.search}
              onChange={(v) => dispatch({ type: "SET_SEARCH", value: v })}
              className="flex-1 min-w-0"
            />
            <ViewToggle
              value={filters.view}
              onChange={(v) => dispatch({ type: "SET_VIEW", value: v })}
            />
            {/* Mobile-only filters button */}
            <button
              onClick={() => setShowSecondaryFilters((v) => !v)}
              aria-expanded={showSecondaryFilters}
              aria-label="Toggle cost and type filters"
              className={cn(
                "md:hidden shrink-0 h-9 px-3 rounded-xl border text-sm font-medium flex items-center gap-1.5 transition-all",
                showSecondaryFilters || secondaryFilterCount > 0
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400"
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {secondaryFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-zinc-900 text-[10px] font-bold flex items-center justify-center leading-none">
                  {secondaryFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Row 2: Category pills */}
          <CategoryFilter
            value={filters.category}
            onChange={(v) => dispatch({ type: "SET_CATEGORY", value: v })}
            counts={categoryCounts}
          />

          {/* Row 3: Cost + Type — always on desktop, toggle on mobile */}
          <div className={showSecondaryFilters ? "flex gap-3 flex-wrap" : "hidden md:flex gap-3 flex-wrap"}>
            <CostFilter
              value={filters.cost}
              onChange={(v) => dispatch({ type: "SET_COST", value: v })}
              counts={costCounts}
            />
            <TypeFilter
              value={filters.type}
              onChange={(v) => dispatch({ type: "SET_TYPE", value: v })}
              counts={typeCounts}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <p className="text-sm text-zinc-500">
            {filtered.length === city.places.length ? (
              <>
                <span className="font-semibold text-zinc-800">{city.places.length}</span> places
              </>
            ) : (
              <>
                <span className="font-semibold text-zinc-800">{filtered.length}</span> of{" "}
                <span className="font-semibold text-zinc-800">{city.places.length}</span>{" "}
                {filtered.length === 1 ? "match" : "matches"}
              </>
            )}
          </p>
          {hasActiveFilters && (
            <ActiveFilters
              filters={filters}
              onRemove={handleRemoveFilter}
              onClearAll={() => dispatch({ type: "RESET" })}
            />
          )}
        </div>

        {/* Map view */}
        {filters.view === "map" && (
          <div>
            <MapView places={filtered} center={[city.lat, city.lng]} />
            <p className="text-xs text-zinc-400 mt-2 text-center">
              Showing {filtered.filter((p) => p.lat && p.lng).length} mapped places
            </p>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <TreePine className="w-10 h-10 text-zinc-200" />
            <div>
              <p className="font-semibold text-zinc-700">Nothing found.</p>
              <p className="text-sm text-zinc-400 mt-1">
                Try adjusting your filters or{" "}
                <button
                  onClick={() => dispatch({ type: "RESET" })}
                  className="text-brand hover:underline"
                >
                  clear all
                </button>
                .
              </p>
            </div>
          </div>
        )}

        {/* Grid view */}
        {filters.view === "grid" && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((place) => (
              <PlaceCard key={place.id} place={place} variant="grid" />
            ))}
          </div>
        )}

        {/* List view */}
        {filters.view === "list" && filtered.length > 0 && (
          <div className="flex flex-col gap-2">
            {filtered.map((place) => (
              <PlaceCard key={place.id} place={place} variant="list" />
            ))}
          </div>
        )}

        {/* Map + list below on desktop */}
        {filters.view === "map" && filtered.length > 0 && (
          <div className="hidden lg:block mt-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">All listed places</h3>
            <div className="flex flex-col gap-2">
              {filtered.map((place) => (
                <PlaceCard key={place.id} place={place} variant="list" />
              ))}
            </div>
          </div>
        )}

        {/* Weekly planner */}
        <div className="border-t border-zinc-100 pt-8 mt-2">
          <WeeklySchedule availablePlaces={city.places} />
        </div>
      </div>
    </div>
  );
}

