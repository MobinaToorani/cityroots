"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { CityGuide } from "@/lib/types";
import { CATEGORY_COLORS } from "@/data/categories";
import { Category } from "@/lib/types";

const COMING_SOON = [
  { cityName: "Barrie", province: "Ontario" },
  { cityName: "Toronto", province: "Ontario" },
  { cityName: "Hamilton", province: "Ontario" },
];

function CityCard({ city }: { city: CityGuide }) {
  const freePlaces = city.places.filter((p) => p.isFree).length;
  const coveredCategories = new Set(city.places.map((p) => p.category as Category));
  const categoryKeys = Object.keys(CATEGORY_COLORS) as Category[];

  return (
    <Link
      href={`/${city.cityId}`}
      className="group flex flex-col gap-5 p-6 bg-white dark:bg-[#1B1916] border border-[#E5DED4] dark:border-[#2E2A24] rounded-2xl hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-stone-800 dark:text-stone-100 leading-snug">
            {city.cityName}
          </h3>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 tracking-wide uppercase">
            {city.province}, {city.country}
          </p>
          {city.tagline && (
            <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-2 leading-relaxed">
              {city.tagline}
            </p>
          )}
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors mt-0.5 shrink-0" />
      </div>

      {/* Category dots */}
      <div className="flex items-center gap-1.5">
        {categoryKeys.map((key) => (
          <div
            key={key}
            className="w-2 h-2 rounded-full shrink-0 transition-opacity duration-300"
            style={{ background: CATEGORY_COLORS[key], opacity: coveredCategories.has(key) ? 0.8 : 0.1 }}
          />
        ))}
      </div>

      <div className="flex items-center gap-4 text-[11px] text-stone-400 dark:text-stone-500 border-t border-[#E5DED4]/60 dark:border-[#2E2A24]/60 pt-4">
        <span>{city.places.length} places</span>
        <span className="w-px h-3 bg-stone-200 dark:bg-stone-700" aria-hidden />
        <span className="text-brand dark:text-green-500">{freePlaces} free</span>
        <span className="w-px h-3 bg-stone-200 dark:bg-stone-700" aria-hidden />
        <span>{coveredCategories.size} categories</span>
      </div>
    </Link>
  );
}

interface ExploreClientProps {
  cities: CityGuide[];
}

export function ExploreClient({ cities }: ExploreClientProps) {
  const [query, setQuery] = useState("");

  const filteredCities = cities.filter(
    (c) =>
      c.cityName.toLowerCase().includes(query.toLowerCase()) ||
      c.province.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      {/* Page header */}
      <div className="relative overflow-hidden bg-white dark:bg-[#1B1916] border-b border-[#E5DED4] dark:border-[#2E2A24]">
        <div
          className="absolute -top-16 -right-16 w-[420px] h-[420px] rounded-full pointer-events-none animate-aura-drift"
          style={{ background: "radial-gradient(circle, rgba(61,107,82,0.08) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[350px] h-[200px] rounded-full pointer-events-none animate-aura-pulse opacity-50"
          style={{ background: "radial-gradient(ellipse, rgba(180,160,130,0.08) 0%, transparent 70%)", animationDelay: "2s" }}
        />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-10 sm:pt-14 sm:pb-12">
          <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-brand dark:text-green-500 mb-4">
            City guides
          </p>
          <h1 className="font-serif text-[28px] sm:text-[36px] lg:text-[44px] text-stone-900 dark:text-stone-50 mb-3">
            Explore cities.
          </h1>
          <p className="text-[13px] sm:text-[14px] text-stone-400 dark:text-stone-500 max-w-sm leading-relaxed">
            Community lifestyle guides across Canada. Free and affordable options, always.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10 flex flex-col gap-8 sm:gap-10">

        {/* Search */}
        <div className="flex items-center gap-2 bg-white dark:bg-stone-900 border border-[#E5DED4] dark:border-stone-700 rounded-xl px-3 h-10 max-w-sm focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/15 transition-all">
          <Search className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" />
          <input
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city or province..."
            className="flex-1 text-[13px] bg-transparent outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
            aria-label="Search cities"
          />
        </div>

        {/* Available cities */}
        {filteredCities.length > 0 && (
          <section className="flex flex-col gap-5">
            <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 tracking-[0.1em] uppercase">
              Available now
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCities.map((city) => (
                <CityCard key={city.cityId} city={city} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {filteredCities.length === 0 && query && (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-[#E5DED4] dark:border-[#2E2A24] flex items-center justify-center text-xl">
              🏙️
            </div>
            <div>
              <p className="text-[14px] font-medium text-stone-600 dark:text-stone-400">
                No cities match &ldquo;{query}&rdquo;
              </p>
              <button
                onClick={() => setQuery("")}
                className="text-[13px] text-brand dark:text-green-500 hover:opacity-75 transition-opacity mt-1"
              >
                Clear search
              </button>
            </div>
          </div>
        )}

        {/* Coming soon */}
        <section className="flex flex-col gap-5 border-t border-[#E5DED4] dark:border-[#2E2A24] pt-8 sm:pt-10">
          <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 tracking-[0.1em] uppercase">
            Coming soon
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMING_SOON.map((c) => (
              <div
                key={c.cityName}
                className="flex items-center justify-between p-5 bg-white dark:bg-[#1B1916] border border-[#E5DED4] dark:border-[#2E2A24] rounded-2xl"
              >
                <div>
                  <p className="text-[14px] font-medium text-stone-400 dark:text-stone-500">{c.cityName}</p>
                  <p className="text-[11px] text-stone-300 dark:text-stone-600 mt-0.5 uppercase tracking-wide">{c.province}</p>
                </div>
                <span className="text-[10px] font-medium text-stone-300 dark:text-stone-600 tracking-wide uppercase">Soon</span>
              </div>
            ))}
            <Link
              href="/submit"
              className="group flex items-center justify-between p-5 bg-white dark:bg-[#1B1916] border border-[#E5DED4] dark:border-[#2E2A24] rounded-2xl hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              <div>
                <p className="text-[14px] font-medium text-stone-800 dark:text-stone-200">Request a city</p>
                <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-0.5">Know a community that needs a guide?</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors shrink-0" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
