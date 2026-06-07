"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { CityGuide } from "@/lib/types";

const COMING_SOON = [
  { cityName: "Barrie", province: "Ontario" },
  { cityName: "Toronto", province: "Ontario" },
  { cityName: "Hamilton", province: "Ontario" },
];

function CityCard({ city }: { city: CityGuide }) {
  const freePlaces = city.places.filter((p) => p.isFree).length;
  const categories = new Set(city.places.map((p) => p.category)).size;

  return (
    <Link
      href={`/${city.cityId}`}
      className="group flex flex-col gap-3 p-6 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 hover:shadow-sm transition-all duration-150"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 text-base">{city.cityName}</h3>
          <p className="text-sm text-zinc-500">{city.province}, {city.country}</p>
          {city.tagline && (
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{city.tagline}</p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors mt-0.5 shrink-0 ml-3" />
      </div>
      <div className="flex items-center gap-4 text-xs text-zinc-400 pt-2 border-t border-zinc-100">
        <span>{city.places.length} places</span>
        <span>{freePlaces} free</span>
        <span>{categories} categories</span>
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">Explore cities</h1>
        <p className="text-sm text-zinc-500">Community lifestyle guides across Canada.</p>
      </div>

      <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 h-10 mb-10 max-w-md focus-within:border-zinc-400 transition-colors">
        <Search className="w-4 h-4 text-zinc-400 shrink-0" />
        <input
          type="text"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city or province..."
          className="flex-1 text-sm bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400"
        />
      </div>

      {filteredCities.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
            Available now
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCities.map((city) => (
              <CityCard key={city.cityId} city={city} />
            ))}
          </div>
        </section>
      )}

      {filteredCities.length === 0 && query && (
        <div className="py-12">
          <p className="font-medium text-zinc-700 mb-1">No cities match &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-zinc-500">
            <button onClick={() => setQuery("")} className="text-brand hover:underline">
              Clear search
            </button>{" "}
            to see all cities.
          </p>
        </div>
      )}

      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
          Coming soon
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMING_SOON.map((c) => (
            <div
              key={c.cityName}
              className="flex items-center justify-between p-5 bg-white border border-zinc-200 rounded-xl"
            >
              <div>
                <h3 className="font-medium text-zinc-500 text-sm">{c.cityName}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{c.province}</p>
              </div>
              <span className="text-xs text-zinc-300 font-medium">Soon</span>
            </div>
          ))}
          <Link
            href="/submit"
            className="flex items-center justify-between p-5 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 hover:shadow-sm transition-all duration-150"
          >
            <div>
              <p className="font-medium text-zinc-900 text-sm">Request a city</p>
              <p className="text-xs text-zinc-400 mt-0.5">Know a community that needs a guide?</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-300 shrink-0" />
          </Link>
        </div>
      </section>
    </div>
  );
}
