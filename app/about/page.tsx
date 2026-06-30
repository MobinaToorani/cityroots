import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CityGuide } from "@/lib/types";
import richmondhillData from "@/data/cities/richmond-hill.json";
import newmarketData from "@/data/cities/newmarket.json";
import markhamData from "@/data/cities/markham.json";
import vaughanData from "@/data/cities/vaughan.json";
import oakvilleData from "@/data/cities/oakville.json";
import burlingtonData from "@/data/cities/burlington.json";
import kitchenerData from "@/data/cities/kitchener.json";
import waterlooData from "@/data/cities/waterloo.json";
import cambridgeData from "@/data/cities/cambridge.json";

const CITIES = [richmondhillData, newmarketData, markhamData, vaughanData, oakvilleData, burlingtonData, kitchenerData, waterlooData, cambridgeData] as unknown as CityGuide[];

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
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 pt-10 pb-12 sm:pt-16 sm:pb-16">
          <div className="flex items-center gap-4 mb-8 sm:mb-12">
            <span className="font-sans text-[9px] sm:text-[10px] tracking-[0.28em] uppercase text-stone-400 dark:text-stone-600">
              The project
            </span>
            <div className="h-px bg-stone-200 dark:bg-stone-800 w-16 sm:w-28" />
          </div>
          <h1 className="font-serif text-[48px] sm:text-[68px] lg:text-[88px] leading-[0.88] tracking-[-0.04em] text-stone-900 dark:text-stone-50 mb-5 sm:mb-7">
            <span className="block">Built for people,</span>
            <span className="block italic font-normal text-[#3D6B52] dark:text-[#7AB893] pl-6 sm:pl-14">
              not profit.
            </span>
          </h1>
          <p className="text-[14px] sm:text-[15px] text-stone-400 dark:text-stone-500 leading-relaxed max-w-lg">
            CityRoots is a community-built directory of local resources: parks, libraries, cafes, events,
            thrift stores, community centres and more, organized by every dimension of daily life.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-12 sm:space-y-20">

        {/* Principles */}
        <section className="space-y-8 sm:space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
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
        <section className="space-y-5 border-t border-[#E5DED4] dark:border-[#2E2A24] pt-10 sm:pt-14">
          <div>
            <p className="font-sans text-[9px] tracking-[0.28em] uppercase text-stone-400 dark:text-stone-600 mb-2.5">01</p>
            <h2 className="font-serif text-[30px] sm:text-[40px] leading-[0.9] tracking-[-0.03em] text-stone-800 dark:text-stone-100">
              How it works.
            </h2>
          </div>
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
        <section className="space-y-5 border-t border-[#E5DED4] dark:border-[#2E2A24] pt-10 sm:pt-14">
          <div>
            <p className="font-sans text-[9px] tracking-[0.28em] uppercase text-stone-400 dark:text-stone-600 mb-2.5">02</p>
            <h2 className="font-serif text-[30px] sm:text-[40px] leading-[0.9] tracking-[-0.03em] text-stone-800 dark:text-stone-100">
              Contribute.
            </h2>
          </div>
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
          <div>
            <p className="font-sans text-[9px] tracking-[0.28em] uppercase text-stone-400 dark:text-stone-600 mb-2.5">03</p>
            <h2 className="font-serif text-[30px] sm:text-[40px] leading-[0.9] tracking-[-0.03em] text-stone-800 dark:text-stone-100">
              Cities covered.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CITIES.map((city) => {
              const freeCount = city.places.filter((p) => p.isFree).length;
              return (
                <Link
                  key={city.cityId}
                  href={`/${city.cityId}`}
                  className="group relative overflow-hidden flex items-center justify-between p-4 bg-white dark:bg-[#1B1916] border border-[#E5DED4] dark:border-[#2E2A24] rounded-xl transition-all duration-500 hover:border-brand/20 dark:hover:border-green-800/30 hover:shadow-[0_12px_32px_-8px_rgba(61,107,82,0.15),0_2px_8px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_32px_-8px_rgba(106,173,130,0.12),0_2px_8px_rgba(0,0,0,0.3)] before:content-[''] before:absolute before:-top-8 before:-right-8 before:w-28 before:h-28 before:rounded-full before:bg-[radial-gradient(circle,rgba(61,107,82,0.08)_0%,transparent_70%)] before:opacity-0 before:transition-opacity before:duration-500 before:pointer-events-none hover:before:opacity-100"
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
        <section className="space-y-4 border-t border-[#E5DED4] dark:border-[#2E2A24] pt-10 sm:pt-14">
          <div>
            <p className="font-sans text-[9px] tracking-[0.28em] uppercase text-stone-400 dark:text-stone-600 mb-2.5">04</p>
            <h2 className="font-serif text-[30px] sm:text-[40px] leading-[0.9] tracking-[-0.03em] text-stone-800 dark:text-stone-100">
              Long-term vision.
            </h2>
          </div>
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
