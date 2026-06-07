import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { CityGuide } from "@/lib/types";
import { CityGuideClient } from "@/components/CityGuideClient";
import richmondhillData from "@/data/cities/richmond-hill.json";
import newmarketData from "@/data/cities/newmarket.json";
import markhamData from "@/data/cities/markham.json";
import vaughanData from "@/data/cities/vaughan.json";
import oakvilleData from "@/data/cities/oakville.json";

function CityPageSkeleton() {
  return (
    <div>
      <div className="bg-white border-b border-zinc-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-3 w-32 bg-zinc-100 rounded mb-5" />
          <div className="h-8 w-56 bg-zinc-100 rounded mb-2" />
          <div className="h-3.5 w-36 bg-zinc-100 rounded mb-4" />
          <div className="h-3.5 w-80 bg-zinc-100 rounded mb-2" />
          <div className="h-3.5 w-64 bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="border-b border-zinc-200 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-9 bg-zinc-100 rounded-lg w-full mb-3" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 w-20 bg-zinc-100 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-xl p-5 h-52">
              <div className="h-3 w-24 bg-zinc-100 rounded mb-3" />
              <div className="h-5 w-40 bg-zinc-100 rounded mb-2" />
              <div className="h-3 w-28 bg-zinc-100 rounded mb-4" />
              <div className="h-3 w-full bg-zinc-100 rounded mb-1.5" />
              <div className="h-3 w-3/4 bg-zinc-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const CITY_DATA: Record<string, CityGuide> = {
  "richmond-hill": richmondhillData as unknown as CityGuide,
  "newmarket": newmarketData as unknown as CityGuide,
  "markham": markhamData as unknown as CityGuide,
  "vaughan": vaughanData as unknown as CityGuide,
  "oakville": oakvilleData as unknown as CityGuide,
};

export function generateStaticParams() {
  return Object.keys(CITY_DATA).map((cityId) => ({ city: cityId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: cityId } = await params;
  const data = CITY_DATA[cityId];
  if (!data) return {};
  return {
    title: data.cityName,
    description: data.heroDescription,
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: cityId } = await params;
  const data = CITY_DATA[cityId];
  if (!data) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${data.cityName} Community Guide`,
    description: data.heroDescription,
    url: `https://cityroots.ca/${cityId}`,
    about: {
      "@type": "City",
      name: data.cityName,
      containedInPlace: { "@type": "State", name: data.province },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<CityPageSkeleton />}>
        <CityGuideClient city={data} />
      </Suspense>
    </>
  );
}
