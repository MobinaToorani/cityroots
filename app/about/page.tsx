import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CityGuide } from "@/lib/types";
import richmondhillData from "@/data/cities/richmond-hill.json";
import newmarketData from "@/data/cities/newmarket.json";
import markhamData from "@/data/cities/markham.json";
import vaughanData from "@/data/cities/vaughan.json";
import oakvilleData from "@/data/cities/oakville.json";

const CITIES = [richmondhillData, newmarketData, markhamData, vaughanData, oakvilleData] as unknown as CityGuide[];

export const metadata: Metadata = {
  title: "About",
  description:
    "CityRoots is a community-built directory of free and affordable local resources. No ads, no sponsored listings. Built for people, not profit.",
};

const PRINCIPLES = [
  {
    number: "01",
    heading: "No ads. No sponsored listings.",
    body: "A place either belongs here or it doesn't. Nobody pays to be featured.",
  },
  {
    number: "02",
    heading: "Free options, always visible.",
    body: "Cost is on every listing. Filtering by budget is one tap.",
  },
  {
    number: "03",
    heading: "Community-sourced, curator-reviewed.",
    body: "Anyone can submit. Every listing is reviewed before it appears.",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Header */}
      <div className="relative overflow-hidden bg-white dark:bg-[#1B1916] border-b border-[#E5DED4] dark:border-[#2E2A24]">
        <div
          className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full pointer-events-none animate-aura-drift"
          style={{ background: "radial-gradient(circle, rgba(61,107,82,0.07) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 -left-20 w-[400px] h-[250px] rounded-full pointer-events-none animate-aura-breathe opacity-50"
          style={{ background: "radial-gradient(ellipse, rgba(180,160,130,0.09) 0%, transparent 70%)", animationDelay: "4s" }}
        />
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 pt-14 pb-14">
          <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-brand dark:text-green-500 mb-5">
            The project
          </p>
          <h1 className="font-serif text-[36px] sm:text-[48px] text-stone-900 dark:text-stone-50 mb-5">
            Built for people,<br />
            <span
              className="italic font-normal gradient-text"
              style={{ backgroundImage: "linear-gradient(135deg, #3D6B52 0%, #7AB893 50%, #78716C 100%)" }}
            >
              not profit.
            </span>
          </h1>
          <p className="text-[15px] text-stone-400 dark:text-stone-500 leading-relaxed max-w-lg">
            CityRoots is a community-built directory of local resources: parks, libraries, cafes, events,
            thrift stores, community centres and more, organized by every dimension of daily life.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 space-y-20">

        {/* Principles */}
        <section className="space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {PRINCIPLES.map((item) => (
              <div key={item.number} className="space-y-3">
                <p className="text-[11px] font-medium text-stone-300 dark:text-stone-700 tracking-[0.12em]">
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
        </section>

        {/* How it works */}
        <section className="space-y-5 border-t border-[#E5DED4] dark:border-[#2E2A24] pt-14">
          <h2 className="font-serif text-[22px] text-stone-800 dark:text-stone-100">
            How it works
          </h2>
          <div className="space-y-4">
            <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed">
              Listings are submitted by local contributors and reviewed before publishing.
              The goal is accuracy over volume. A small, reliable guide is more useful than
              an exhaustive but unverified one.
            </p>
            <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed">
              Every listing has a cost level (free, low, moderate, varies) so you can filter
              by what fits your budget. Free options surface first.
            </p>
          </div>
        </section>

        {/* Contributing */}
        <section className="space-y-5 border-t border-[#E5DED4] dark:border-[#2E2A24] pt-14">
          <h2 className="font-serif text-[22px] text-stone-800 dark:text-stone-100">
            Contribute
          </h2>
          <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed">
            Anyone can submit a place. Submissions go through a quick review before appearing.
            If you know a community program, a hidden park, or a weekly market, please add it.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand/90 text-white text-[13px] font-medium rounded-full transition-colors"
            >
              Submit a place
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="mailto:hello@cityroots.ca"
              className="text-[13px] text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              Get in touch
            </a>
          </div>
        </section>

        {/* Cities */}
        <section className="space-y-6 border-t border-[#E5DED4] dark:border-[#2E2A24] pt-14">
          <h2 className="font-serif text-[22px] text-stone-800 dark:text-stone-100">
            Cities covered
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CITIES.map((city) => {
              const freeCount = city.places.filter((p) => p.isFree).length;
              return (
                <Link
                  key={city.cityId}
                  href={`/${city.cityId}`}
                  className="group flex items-center justify-between p-4 bg-white dark:bg-[#1B1916] border border-[#E5DED4] dark:border-[#2E2A24] rounded-xl hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all duration-300"
                >
                  <div>
                    <p className="text-[13px] font-medium text-stone-800 dark:text-stone-200">{city.cityName}</p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                      {city.places.length} places &middot; <span className="text-brand dark:text-green-500">{freeCount} free</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-stone-300 dark:text-stone-600 uppercase tracking-wide">{city.province}</span>
                    <ArrowRight className="w-3 h-3 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Vision */}
        <section className="space-y-4 border-t border-[#E5DED4] dark:border-[#2E2A24] pt-14">
          <h2 className="font-serif text-[22px] text-stone-800 dark:text-stone-100">
            Long-term vision
          </h2>
          <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed">
            The aim is a non-profit, open-data platform where each city has local curators and
            the information is freely available to anyone who wants to build on it.
            Currently early-stage.
          </p>
        </section>
      </div>
    </div>
  );
}
