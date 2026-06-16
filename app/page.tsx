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
      className="group flex flex-col gap-5 p-6 bg-white dark:bg-[#1B1916] border border-[#E5DED4] dark:border-[#2E2A24] rounded-2xl hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-[0_4px_32px_rgba(61,107,82,0.08)] dark:hover:shadow-[0_4px_32px_rgba(106,173,130,0.08)] transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-stone-800 dark:text-stone-100 leading-snug">
            {city.cityName}
          </h3>
          <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-0.5 tracking-wide uppercase">
            {city.province}
          </p>
          {city.tagline && (
            <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-2 leading-relaxed">
              {city.tagline}
            </p>
          )}
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 group-hover:text-brand dark:group-hover:text-green-500 transition-colors mt-0.5 shrink-0" />
      </div>

      <div className="flex items-center gap-1.5">
        {ALL_CATEGORY_KEYS.map((key) => (
          <div
            key={key}
            className="w-2 h-2 rounded-full shrink-0 transition-opacity duration-300"
            style={{ background: CATEGORY_COLORS[key], opacity: coveredCategories.has(key) ? 0.8 : 0.1 }}
            title={CATEGORIES[key].label}
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

const WHY_ITEMS = [
  {
    number: "01",
    heading: "No ads. No sponsored listings.",
    body: "Every place earns its spot on merit. Nobody pays to appear here.",
  },
  {
    number: "02",
    heading: "Free options, always first.",
    body: "Cost is visible on every listing. Filtering by budget takes one tap.",
  },
  {
    number: "03",
    heading: "Ten dimensions of daily life.",
    body: "From fitness and food to mental health, finances, and community.",
  },
];

export default function HomePage() {
  const totalPlaces = cities.reduce((n, c) => n + c.places.length, 0);
  const totalFree   = cities.reduce((n, c) => n + c.places.filter((p) => p.isFree).length, 0);

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Light mode aura orbs */}
        <div
          className="absolute -top-32 -left-40 w-[700px] h-[600px] rounded-full pointer-events-none animate-aura-drift"
          style={{ background: "radial-gradient(circle, rgba(61,107,82,0.12) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none animate-aura-pulse"
          style={{ background: "radial-gradient(circle, rgba(106,173,130,0.08) 0%, transparent 70%)", animationDelay: "2.5s" }}
        />
        <div
          className="absolute bottom-10 left-1/3 w-[600px] h-[300px] rounded-full pointer-events-none animate-aura-breathe"
          style={{ background: "radial-gradient(ellipse, rgba(180,160,130,0.09) 0%, transparent 70%)", animationDelay: "1s" }}
        />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-16 sm:pt-20 sm:pb-32 lg:pb-40">
          <div className="max-w-3xl">
            <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-brand dark:text-green-500 mb-5 sm:mb-6">
              Community lifestyle guide
            </p>

            <h1 className="font-serif text-[30px] sm:text-[44px] lg:text-[58px] leading-[1.1] sm:leading-[1.08] tracking-[-0.02em] sm:tracking-[-0.025em] text-stone-900 dark:text-stone-50 mb-5 sm:mb-7">
              <span className="block">Every corner of your city,</span>
              <span
                className="italic font-normal gradient-text"
                style={{ backgroundImage: "linear-gradient(135deg, #3D6B52 0%, #7AB893 40%, #A8C5A0 70%, #78716C 100%)" }}
              >
                curated for real life.
              </span>
            </h1>

            <p className="text-[14px] sm:text-[15px] text-stone-500 dark:text-stone-400 leading-relaxed max-w-xl mb-8 sm:mb-10">
              Free and affordable parks, cafes, thrift stores, events, and community programs,
              organized by every dimension of daily life. No ads. No sponsored listings.
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 sm:px-7 sm:py-3.5 text-white text-[13px] font-medium rounded-full transition-all duration-300 shadow-[0_4px_24px_rgba(61,107,82,0.3)] hover:shadow-[0_8px_36px_rgba(61,107,82,0.45)] hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #3D6B52 0%, #5A9470 100%)" }}
              >
                Explore cities
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="flex items-center gap-4 text-[11px] sm:text-[12px] text-stone-400 dark:text-stone-500">
                <span><span className="font-semibold text-stone-700 dark:text-stone-300">{totalPlaces}</span> places</span>
                <span className="w-px h-3 bg-stone-200 dark:bg-stone-700" aria-hidden />
                <span className="text-brand dark:text-green-500"><span className="font-semibold">{totalFree}</span> free</span>
                <span className="w-px h-3 bg-stone-200 dark:bg-stone-700" aria-hidden />
                <span><span className="font-semibold text-stone-700 dark:text-stone-300">{cities.length}</span> cities</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CITIES ── */}
      <section className="bg-section-cities border-y border-[#E5DED4] dark:border-[#2E2A24] py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="font-serif text-[26px] text-stone-800 dark:text-stone-100">
              Cities
            </h2>
            <Link href="/explore" className="text-[12px] text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors tracking-wide uppercase">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map((city) => (
              <CityCard key={city.cityId} city={city} />
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CITYROOTS ── */}
      <section className="relative overflow-hidden bg-section-why py-14 sm:py-28">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none animate-aura-breathe"
          style={{ background: "radial-gradient(circle, rgba(61,107,82,0.05) 0%, transparent 70%)", animationDelay: "3s" }}
        />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <div className="mb-14">
            <h2 className="font-serif text-[28px] text-stone-800 dark:text-stone-100 mb-3">
              Built differently.
            </h2>
            <p className="text-[14px] text-stone-400 dark:text-stone-500 max-w-sm leading-relaxed">
              CityRoots exists because most local guides exist to sell you something.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            {WHY_ITEMS.map((item) => (
              <div key={item.number} className="space-y-4">
                <p
                  className="text-[11px] font-medium tracking-[0.12em] gradient-text"
                  style={{ backgroundImage: "linear-gradient(90deg, #3D6B52, #7AB893)" }}
                >
                  {item.number}
                </p>
                <h3 className="text-[14px] font-semibold text-stone-800 dark:text-stone-200 leading-snug">
                  {item.heading}
                </h3>
                <p className="text-[13px] text-stone-400 dark:text-stone-500 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="relative overflow-hidden bg-section-categories border-t border-[#E5DED4] dark:border-[#2E2A24] py-12 sm:py-20">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(61,107,82,0.04) 0%, transparent 60%)" }}
        />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="font-serif text-[26px] text-stone-800 dark:text-stone-100">
              Ten categories.
            </h2>
            <Link href="/explore" className="text-[12px] text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors tracking-wide uppercase">
              Choose a city
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => (
              <div
                key={key}
                className="flex flex-col gap-2.5 p-4 rounded-xl border border-[#E5DED4] dark:border-[#2E2A24] bg-white dark:bg-[#1B1916] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-stone-300 dark:hover:border-stone-600 transition-all duration-300"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <div>
                  <p className="text-[12px] font-semibold text-stone-700 dark:text-stone-300 leading-tight">{cat.shortLabel}</p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 leading-tight">{cat.description}</p>
                </div>
                <div
                  className="h-0.5 w-8 rounded-full mt-auto"
                  style={{ background: `linear-gradient(to right, ${CATEGORY_COLORS[key]}, ${CATEGORY_COLORS[key]}60)` }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUBMIT CTA ── */}
      <section className="relative overflow-hidden bg-section-cta py-12 sm:py-20">
        <div
          className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none animate-aura-pulse opacity-60"
          style={{ background: "radial-gradient(circle, rgba(61,107,82,0.07) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="font-serif text-[24px] text-stone-800 dark:text-stone-100">
                Know a hidden gem?
              </h2>
              <p className="text-[13px] text-stone-400 dark:text-stone-500 max-w-sm">
                Submissions are reviewed before being added. Community-curated, always.
              </p>
            </div>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-brand dark:text-green-500 hover:opacity-75 transition-opacity"
            >
              Submit a place
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
