"use client";

import { useReducer, useMemo, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import Fuse from "fuse.js";
import { CityGuide, FilterState, Category, CostLevel, PlaceType, Place, defaultFilters } from "@/lib/types";
import { CATEGORIES, CATEGORY_COLORS } from "@/data/categories";
import { createSearch } from "@/lib/search";
import { useFilteredPlaces } from "@/hooks/useFilteredPlaces";
import { PlaceCard } from "@/components/PlaceCard";
import { SearchBar } from "@/components/SearchBar";
import { ActiveFilters } from "@/components/ActiveFilters";
import { ViewToggle } from "@/components/ViewToggle";
import { WellbeingWheel } from "@/components/WellbeingWheel";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { Leaf, ChevronDown, ChevronUp, Star, ChevronsUp } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";

const MapView = dynamic(() => import("@/components/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-2xl bg-stone-50 dark:bg-stone-900 border border-[#E5DED4] dark:border-[#2E2A24] flex items-center justify-center">
      <p className="text-[13px] text-stone-400">Loading map...</p>
    </div>
  ),
});

type FilterAction =
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_CATEGORY"; value: Category | "all" }
  | { type: "SET_COST"; value: CostLevel | "all" }
  | { type: "SET_TYPE"; value: PlaceType | "all" }
  | { type: "SET_VIEW"; value: "grid" | "list" | "map" }
  | { type: "TOGGLE_RECOMMENDED" }
  | { type: "REMOVE"; key: keyof FilterState }
  | { type: "RESET" };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_SEARCH":   return { ...state, search: action.value };
    case "SET_CATEGORY": return { ...state, category: action.value };
    case "SET_COST":     return { ...state, cost: action.value };
    case "SET_TYPE":     return { ...state, type: action.value };
    case "SET_VIEW":     return { ...state, view: action.value };
    case "TOGGLE_RECOMMENDED": return { ...state, showRecommendedOnly: !state.showRecommendedOnly };
    case "REMOVE":
      if (action.key === "category")           return { ...state, category: "all" };
      if (action.key === "cost")               return { ...state, cost: "all" };
      if (action.key === "type")               return { ...state, type: "all" };
      if (action.key === "showRecommendedOnly") return { ...state, showRecommendedOnly: false };
      return state;
    case "RESET": return defaultFilters;
    default: return state;
  }
}

function filtersToParams(filters: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.category !== "all") p.set("category", filters.category);
  if (filters.cost !== "all")     p.set("cost", filters.cost);
  if (filters.type !== "all")     p.set("type", filters.type);
  if (filters.search)             p.set("q", filters.search);
  if (filters.view !== "grid")    p.set("view", filters.view);
  if (filters.showRecommendedOnly) p.set("picks", "1");
  return p;
}

function applyNonCategoryFilters(places: Place[], filters: FilterState, fuse: Fuse<Place>): Place[] {
  let result = filters.search.trim()
    ? fuse.search(filters.search.trim()).map((r) => r.item)
    : places;
  if (filters.cost !== "all") result = result.filter((p) => p.cost === filters.cost);
  if (filters.type !== "all") result = result.filter((p) => p.type === filters.type);
  if (filters.showRecommendedOnly) result = result.filter((p) => p.isRecommended);
  return result;
}

const COST_PILLS: { value: CostLevel | "all"; label: string; color?: string }[] = [
  { value: "all",      label: "All costs" },
  { value: "free",     label: "Free",      color: "#059669" },
  { value: "low",      label: "Low cost",  color: "#0284c7" },
  { value: "moderate", label: "Moderate",  color: "#d97706" },
  { value: "varies",   label: "Varies" },
];

const TYPE_PILLS: { value: PlaceType | "all"; label: string }[] = [
  { value: "all",      label: "All types" },
  { value: "place",    label: "Places" },
  { value: "event",    label: "Events" },
  { value: "program",  label: "Programs" },
  { value: "resource", label: "Resources" },
];

// Refined pill base classes
const PILL = "shrink-0 h-7 px-3 rounded-full text-[11px] font-medium tracking-wide border whitespace-nowrap transition-all flex items-center gap-1";
const PILL_INACTIVE = "bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border-[#E5DED4] dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-700 dark:hover:text-stone-200";
const PILL_DISABLED = "bg-transparent text-stone-300 dark:text-stone-700 border-stone-100 dark:border-stone-800 cursor-not-allowed";
const PILL_ALL_ACTIVE = "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-transparent";

interface CityGuideClientProps {
  city: CityGuide;
}

export function CityGuideClient({ city }: CityGuideClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cityroots-filters-collapsed");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "true") setFiltersCollapsed(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggleFilters() {
    const next = !filtersCollapsed;
    setFiltersCollapsed(next);
    localStorage.setItem("cityroots-filters-collapsed", String(next));
  }

  const initialFilters: FilterState = useMemo(() => ({
    ...defaultFilters,
    category: (searchParams.get("category") as Category | "all") ?? "all",
    cost:     (searchParams.get("cost")     as CostLevel | "all") ?? "all",
    type:     (searchParams.get("type")     as PlaceType | "all") ?? "all",
    search:   searchParams.get("q") ?? "",
    view:     (searchParams.get("view")     as "grid" | "list" | "map") ?? "grid",
    showRecommendedOnly: searchParams.get("picks") === "1",
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [filters, dispatch] = useReducer(filterReducer, initialFilters);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const params = filtersToParams(filters);
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [filters, pathname, router]);

  const fuse = useMemo(() => createSearch(city.places), [city.places]);
  const filtered = useFilteredPlaces(city.places, filters, fuse);

  const categoryCounts = useMemo(() => {
    const base = applyNonCategoryFilters(city.places, filters, fuse);
    const counts: Partial<Record<Category | "all", number>> = { all: base.length };
    base.forEach((p) => { counts[p.category] = (counts[p.category] ?? 0) + 1; });
    return counts;
  }, [city.places, filters, fuse]);

  const costCounts = useMemo(() => {
    let base = filters.search.trim() ? fuse.search(filters.search.trim()).map((r) => r.item) : city.places;
    if (filters.category !== "all") base = base.filter((p) => p.category === filters.category);
    if (filters.type !== "all") base = base.filter((p) => p.type === filters.type);
    if (filters.showRecommendedOnly) base = base.filter((p) => p.isRecommended);
    const counts: Partial<Record<string, number>> = {};
    base.forEach((p) => { counts[p.cost] = (counts[p.cost] ?? 0) + 1; });
    return counts as Partial<Record<CostLevel | "all", number>>;
  }, [city.places, filters, fuse]);

  const typeCounts = useMemo(() => {
    let base = filters.search.trim() ? fuse.search(filters.search.trim()).map((r) => r.item) : city.places;
    if (filters.category !== "all") base = base.filter((p) => p.category === filters.category);
    if (filters.cost !== "all") base = base.filter((p) => p.cost === filters.cost);
    if (filters.showRecommendedOnly) base = base.filter((p) => p.isRecommended);
    const counts: Partial<Record<PlaceType | "all", number>> = { all: base.length };
    base.forEach((p) => { counts[p.type] = (counts[p.type] ?? 0) + 1; });
    return counts;
  }, [city.places, filters, fuse]);

  const handleRemoveFilter = useCallback((key: keyof FilterState) => dispatch({ type: "REMOVE", key }), []);

  const hasActiveFilters = filters.category !== "all" || filters.cost !== "all" || filters.type !== "all" || filters.showRecommendedOnly;
  const activeFilterCount =
    (filters.category !== "all" ? 1 : 0) +
    (filters.cost !== "all" ? 1 : 0) +
    (filters.type !== "all" ? 1 : 0) +
    (filters.showRecommendedOnly ? 1 : 0);

  return (
    <div>
      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-white dark:bg-stone-900 border border-[#E5DED4] dark:border-stone-700 shadow-lg flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:border-stone-400 dark:hover:border-stone-500 transition-all"
        >
          <ChevronsUp className="w-4 h-4" />
        </button>
      )}
      {/* ── CITY HEADER ── */}
      <div className="relative overflow-hidden bg-white dark:bg-[#1B1916] border-b border-[#E5DED4] dark:border-[#2E2A24]">
        {/* Aura orbs */}
        <div
          className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full pointer-events-none animate-aura-drift"
          style={{ background: "radial-gradient(circle, rgba(61,107,82,0.08) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 -left-20 w-[400px] h-[300px] rounded-full pointer-events-none animate-aura-breathe"
          style={{ background: "radial-gradient(ellipse, rgba(180,160,130,0.07) 0%, transparent 70%)", animationDelay: "3s" }}
        />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-10 sm:pt-12 sm:pb-14">
          <div className="flex items-start gap-12">
            <div className="flex-1 min-w-0">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 mb-5 sm:mb-6" aria-label="Breadcrumb">
                <Link href="/" className="text-[11px] text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors tracking-wide uppercase">
                  Home
                </Link>
                <span className="text-stone-200 dark:text-stone-700 text-[11px]">/</span>
                <Link href="/explore" className="text-[11px] text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors tracking-wide uppercase">
                  Cities
                </Link>
                <span className="text-stone-200 dark:text-stone-700 text-[11px]">/</span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 tracking-wide uppercase">{city.cityName}</span>
              </nav>

              {/* City name */}
              <h1 className="font-serif text-[44px] sm:text-[60px] lg:text-[80px] leading-[0.88] tracking-[-0.04em] text-stone-900 dark:text-stone-50 mb-3">
                {city.cityName}
              </h1>
              <p className="font-sans text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-stone-400 dark:text-stone-600 mb-4">
                {city.province}, {city.country}
              </p>

              {city.heroDescription && (
                <p className="text-[14px] text-stone-400 dark:text-stone-500 leading-relaxed max-w-lg mb-6">
                  {city.heroDescription}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">{city.places.length}</span>
                  <span className="text-stone-400 dark:text-stone-500">places</span>
                </div>
                <div className="w-px h-3 bg-[#E5DED4] dark:bg-[#2E2A24]" aria-hidden />
                <div className="flex items-center gap-1.5 text-[12px]">
                  <Leaf className="w-3 h-3 text-brand dark:text-green-500" />
                  <span className="font-semibold text-brand dark:text-green-500">{city.places.filter((p) => p.isFree).length}</span>
                  <span className="text-stone-400 dark:text-stone-500">free</span>
                </div>
                <div className="w-px h-3 bg-[#E5DED4] dark:bg-[#2E2A24]" aria-hidden />
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">{new Set(city.places.map((p) => p.category)).size}</span>
                  <span className="text-stone-400 dark:text-stone-500">categories</span>
                </div>
              </div>
            </div>

            {/* Wellbeing wheel — desktop */}
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

      {/* ── STICKY FILTER BAR ── */}
      <div className="sticky top-[60px] z-40 bg-[#F7F4EF]/95 dark:bg-[#0F0E0C]/95 backdrop-blur border-b border-[#E5DED4]/60 dark:border-[#2E2A24]/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-2.5 flex flex-col gap-2">

          {/* Row 1: search + view + collapse */}
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
            <button
              onClick={toggleFilters}
              aria-label={filtersCollapsed ? "Show filters" : "Hide filters"}
              aria-expanded={!filtersCollapsed}
              className={cn(
                "shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center transition-all",
                activeFilterCount > 0
                  ? "border-brand/40 dark:border-green-700/40 text-brand dark:text-green-500"
                  : "bg-white dark:bg-stone-900 border-[#E5DED4] dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:border-stone-400 dark:hover:border-stone-500"
              )}
            >
              {filtersCollapsed
                ? <ChevronDown className="w-3.5 h-3.5" />
                : <ChevronUp className="w-3.5 h-3.5" />
              }
            </button>
          </div>

          {/* Row 2: all filter pills in one scrollable row */}
          {!filtersCollapsed && (
            <div className="relative">
              <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[#F7F4EF] dark:from-[#0F0E0C] to-transparent z-10" aria-hidden />
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">

              {/* Category: All */}
              <button
                onClick={() => dispatch({ type: "SET_CATEGORY", value: "all" })}
                aria-pressed={filters.category === "all"}
                className={cn(PILL, filters.category === "all" ? PILL_ALL_ACTIVE : PILL_INACTIVE)}
              >
                All
                {(categoryCounts?.all ?? 0) > 0 && (
                  <span className="opacity-50">({categoryCounts.all})</span>
                )}
              </button>

              {/* Category pills */}
              {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => {
                const isActive = filters.category === key;
                const count = categoryCounts?.[key] ?? 0;
                const available = count > 0 || isActive;
                return (
                  <button
                    key={key}
                    onClick={() => dispatch({ type: "SET_CATEGORY", value: key })}
                    aria-pressed={isActive}
                    disabled={!available}
                    style={isActive ? {
                      background: `${CATEGORY_COLORS[key]}12`,
                      color: CATEGORY_COLORS[key],
                      borderColor: `${CATEGORY_COLORS[key]}35`,
                    } : undefined}
                    className={cn(PILL, isActive ? "border" : available ? PILL_INACTIVE : PILL_DISABLED)}
                  >
                    <CategoryIcon category={key} className="w-3.5 h-3.5" />
                    <span>{cat.shortLabel}</span>
                    {count > 0 && !isActive && <span className="opacity-40">({count})</span>}
                  </button>
                );
              })}

              {/* Divider */}
              <div className="shrink-0 w-px bg-[#E5DED4] dark:bg-stone-700 mx-1 self-center h-4" aria-hidden />

              {/* Cost pills */}
              {COST_PILLS.map((opt) => {
                const isActive = filters.cost === opt.value;
                const count = opt.value === "all" ? undefined : (costCounts?.[opt.value] ?? 0);
                const available = opt.value === "all" || isActive || count === undefined || count > 0;
                return (
                  <button
                    key={opt.value}
                    onClick={() => dispatch({ type: "SET_COST", value: opt.value })}
                    aria-pressed={isActive}
                    disabled={!available}
                    style={isActive && opt.color ? {
                      background: `${opt.color}12`,
                      color: opt.color,
                      borderColor: `${opt.color}35`,
                    } : undefined}
                    className={cn(
                      PILL,
                      isActive
                        ? opt.color ? "border" : PILL_ALL_ACTIVE
                        : available ? PILL_INACTIVE : PILL_DISABLED
                    )}
                  >
                    {opt.value !== "all" && !isActive && opt.color && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: opt.color }} aria-hidden />
                    )}
                    {opt.label}
                    {count !== undefined && count > 0 && !isActive && (
                      <span className="opacity-40">({count})</span>
                    )}
                  </button>
                );
              })}

              {/* Divider */}
              <div className="shrink-0 w-px bg-[#E5DED4] dark:bg-stone-700 mx-1 self-center h-4" aria-hidden />

              {/* Type pills */}
              {TYPE_PILLS.map((opt) => {
                const isActive = filters.type === opt.value;
                const count = opt.value === "all" ? undefined : (typeCounts?.[opt.value] ?? 0);
                const available = opt.value === "all" || isActive || count === undefined || count > 0;
                return (
                  <button
                    key={opt.value}
                    onClick={() => dispatch({ type: "SET_TYPE", value: opt.value })}
                    aria-pressed={isActive}
                    disabled={!available}
                    className={cn(PILL, isActive ? PILL_ALL_ACTIVE : available ? PILL_INACTIVE : PILL_DISABLED)}
                  >
                    {opt.label}
                    {count !== undefined && count > 0 && !isActive && (
                      <span className="opacity-40">({count})</span>
                    )}
                  </button>
                );
              })}

              {/* Divider */}
              <div className="shrink-0 w-px bg-[#E5DED4] dark:bg-stone-700 mx-1 self-center h-4" aria-hidden />

              {/* Picks pill */}
              <button
                onClick={() => dispatch({ type: "TOGGLE_RECOMMENDED" })}
                aria-pressed={filters.showRecommendedOnly}
                className={cn(
                  PILL,
                  filters.showRecommendedOnly
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    : PILL_INACTIVE
                )}
              >
                <Star className={cn("w-3 h-3", filters.showRecommendedOnly ? "fill-amber-500 dark:fill-amber-400" : "fill-none")} />
                Picks
              </button>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RESULTS ── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 sm:py-8 flex flex-col gap-5 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <p className="text-[13px] text-stone-400 dark:text-stone-500">
            {filtered.length === city.places.length ? (
              <><span className="font-medium text-stone-600 dark:text-stone-300">{city.places.length}</span> places</>
            ) : (
              <>
                <span className="font-medium text-stone-600 dark:text-stone-300">{filtered.length}</span> of{" "}
                <span className="font-medium text-stone-600 dark:text-stone-300">{city.places.length}</span>{" "}
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

        {/* Map */}
        {filters.view === "map" && (
          <div>
            <MapView places={filtered} center={[city.lat, city.lng]} />
            <p className="text-[11px] text-stone-300 dark:text-stone-600 mt-2 text-center">
              {filtered.filter((p) => p.lat && p.lng).length} mapped places
            </p>
          </div>
        )}

        {/* Empty */}
        {filtered.length === 0 && (
          <div className="py-24 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-[#E5DED4] dark:border-[#2E2A24] flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <p className="text-[14px] font-medium text-stone-600 dark:text-stone-400">Nothing found.</p>
              <p className="text-[13px] text-stone-400 dark:text-stone-500 mt-1">
                Try adjusting your filters or{" "}
                <button onClick={() => dispatch({ type: "RESET" })} className="text-brand dark:text-green-500 hover:underline">
                  clear all
                </button>.
              </p>
            </div>
          </div>
        )}

        {/* Grid */}
        {filters.view === "grid" && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((place) => (
              <PlaceCard key={place.id} place={place} variant="grid" />
            ))}
          </div>
        )}

        {/* List */}
        {filters.view === "list" && filtered.length > 0 && (
          <div className="flex flex-col gap-2">
            {filtered.map((place) => (
              <PlaceCard key={place.id} place={place} variant="list" />
            ))}
          </div>
        )}

        {/* Map + list below */}
        {filters.view === "map" && filtered.length > 0 && (
          <div className="hidden lg:block mt-2">
            <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-[0.1em] mb-3">
              All listed places
            </p>
            <div className="flex flex-col gap-2">
              {filtered.map((place) => (
                <PlaceCard key={place.id} place={place} variant="list" />
              ))}
            </div>
          </div>
        )}

        {/* Weekly planner */}
        <div className="border-t border-[#E5DED4] dark:border-[#2E2A24] pt-7 sm:pt-10 mt-2">
          <WeeklySchedule availablePlaces={city.places} />
        </div>
      </div>
    </div>
  );
}
