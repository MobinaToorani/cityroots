import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 space-y-12">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-zinc-900">About CityRoots</h1>
        <p className="text-zinc-600 leading-relaxed text-sm">
          CityRoots is a community-built directory of local resources: parks,
          libraries, cafes, events, thrift stores, community centres, and more.
          Everything is organized by category and filterable by cost, so you can
          find what you&apos;re actually looking for.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-900">How it works</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Listings are submitted and reviewed by local contributors. Data starts as
          curated JSON files and is reviewed before publishing. The goal is accuracy
          over volume. A small, reliable guide is more useful than an exhaustive
          but unverified one.
        </p>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Cost levels (free, low, moderate, varies) are added to every listing so
          you can filter by what fits your budget. Free options are always surfaced first.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-900">Contributing</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Anyone can submit a place. Submissions go through a quick review before
          appearing in the guide. If you know a resource that belongs here, a
          community program, a hidden park, a weekly market, please add it.
        </p>
        <div className="flex gap-3 pt-1">
          <Link
            href="/submit"
            className={cn(buttonVariants({ size: "sm" }), "bg-brand hover:bg-brand/90 text-white")}
          >
            Submit a place
          </Link>
          <a
            href="mailto:hello@cityroots.ca"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Get in touch
          </a>
        </div>
      </section>

      <section className="space-y-4 border-t border-zinc-100 pt-8">
        <h2 className="text-base font-semibold text-zinc-900">Cities covered</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CITIES.map((city) => {
            const freeCount = city.places.filter((p) => p.isFree).length;
            return (
              <Link
                key={city.cityId}
                href={`/${city.cityId}`}
                className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-xl hover:border-zinc-300 transition-colors"
              >
                <div>
                  <p className="font-medium text-zinc-900 text-sm">{city.cityName}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {city.places.length} places &middot; {freeCount} free
                  </p>
                </div>
                <span className="text-xs text-zinc-400">{city.province}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-2 border-t border-zinc-100 pt-8">
        <h2 className="text-base font-semibold text-zinc-900">Long-term direction</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          The aim is a non-profit, open-data platform where each city has local
          curators and the information is freely available to anyone who wants to
          build on it. Currently early-stage.
        </p>
      </section>
    </div>
  );
}
