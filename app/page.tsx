import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIES, CATEGORY_COLORS } from "@/data/categories";
import richmondhillData from "@/data/cities/richmond-hill.json";
import newmarketData from "@/data/cities/newmarket.json";
import markhamData from "@/data/cities/markham.json";
import vaughanData from "@/data/cities/vaughan.json";
import oakvilleData from "@/data/cities/oakville.json";
import { CityGuide, Category } from "@/lib/types";

const cities = [richmondhillData, newmarketData, markhamData, vaughanData, oakvilleData] as unknown as CityGuide[];

const ALL_CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

function CityCard({ city }: { city: CityGuide }) {
  const freePlaces = city.places.filter((p) => p.isFree).length;
  const coveredCategories = new Set(city.places.map((p) => p.category as Category));

  return (
    <Link
      href={`/${city.cityId}`}
      className="group flex flex-col gap-4 p-5 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 hover:shadow-sm transition-all duration-150"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900">{city.cityName}</h3>
          <p className="text-sm text-zinc-500">{city.province}</p>
          {city.tagline && (
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">{city.tagline}</p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors mt-0.5 shrink-0 ml-3" />
      </div>
      <div className="flex items-center gap-1.5">
        {ALL_CATEGORY_KEYS.map((key) => (
          <div
            key={key}
            className="w-2 h-2 rounded-full shrink-0 transition-opacity"
            style={{
              background: CATEGORY_COLORS[key],
              opacity: coveredCategories.has(key) ? 0.85 : 0.12,
            }}
            title={CATEGORIES[key].label}
          />
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-zinc-400 border-t border-zinc-100 pt-3">
        <span>{city.places.length} places</span>
        <span className="text-green-600">{freePlaces} free</span>
        <span>{coveredCategories.size} categories</span>
      </div>
    </Link>
  );
}

function CategoryStrip() {
  const categories = Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][];
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {categories.map(([key, cat]) => (
        <div
          key={key}
          className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm"
        >
          <span aria-hidden>{cat.emoji}</span>
          <span className="text-zinc-600 whitespace-nowrap">{cat.shortLabel}</span>
        </div>
      ))}
    </div>
  );
}

const WHY_ITEMS = [
  {
    heading: "No ads or sponsored listings",
    body: "Every place earns its spot on merit. Nobody pays to appear here.",
  },
  {
    heading: "Free options always first",
    body: "Cost is shown on every listing. Free and low-cost options are easy to find.",
  },
  {
    heading: "Built around real life",
    body: "Ten categories cover everything from fitness and food to mental health and finances.",
  },
];

export default function HomePage() {
  const totalPlaces = cities.reduce((n, c) => n + c.places.length, 0);
  const totalFree = cities.reduce((n, c) => n + c.places.filter((p) => p.isFree).length, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16">
      {/* Hero */}
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 leading-tight tracking-tight">
          Local guides for real life.
        </h1>
        <p className="text-zinc-500 text-base leading-relaxed">
          Free and affordable parks, community centres, cafes, thrift stores, events, and programs, organized by every part of daily life. No ads, no sponsored listings.
        </p>
        <div className="flex items-center gap-5 pt-1">
          <span className="text-xs text-zinc-400">
            <span className="font-semibold text-zinc-700">{totalPlaces}</span> places listed
          </span>
          <span className="text-zinc-200" aria-hidden>·</span>
          <span className="text-xs text-zinc-400">
            <span className="font-semibold text-green-700">{totalFree}</span> free
          </span>
          <span className="text-zinc-200" aria-hidden>·</span>
          <span className="text-xs text-zinc-400">
            <span className="font-semibold text-zinc-700">{cities.length}</span> cities
          </span>
        </div>
      </div>

      {/* Cities */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Cities</h2>
          <Link href="/explore" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cities.map((city) => (
            <CityCard key={city.cityId} city={city} />
          ))}
        </div>
      </section>

      {/* Why CityRoots */}
      <section className="border-t border-zinc-100 pt-14 space-y-8">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Why CityRoots</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {WHY_ITEMS.map((item) => (
            <div key={item.heading} className="space-y-2">
              <p className="font-semibold text-zinc-900 text-sm">{item.heading}</p>
              <p className="text-sm text-zinc-500 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category strip */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Ten categories</h2>
          <Link href="/explore" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">
            Choose a city
          </Link>
        </div>
        <CategoryStrip />
        <p className="text-xs text-zinc-400">
          Pick a city above to filter by category, cost, and more.
        </p>
      </section>
    </div>
  );
}
