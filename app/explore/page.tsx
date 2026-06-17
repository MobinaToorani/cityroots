import type { Metadata } from "next";
import { CityGuide } from "@/lib/types";
import { ExploreClient } from "@/components/ExploreClient";
import richmondhillData from "@/data/cities/richmond-hill.json";
import newmarketData from "@/data/cities/newmarket.json";
import markhamData from "@/data/cities/markham.json";
import vaughanData from "@/data/cities/vaughan.json";
import oakvilleData from "@/data/cities/oakville.json";
import burlingtonData from "@/data/cities/burlington.json";

export const metadata: Metadata = {
  title: "Explore Cities",
  description:
    "Browse community lifestyle guides for cities across Canada. Free and affordable local resources organized by every part of daily life.",
};

const CITIES: CityGuide[] = [
  richmondhillData as unknown as CityGuide,
  newmarketData as unknown as CityGuide,
  markhamData as unknown as CityGuide,
  vaughanData as unknown as CityGuide,
  oakvilleData as unknown as CityGuide,
  burlingtonData as unknown as CityGuide,
];

export default function ExplorePage() {
  return <ExploreClient cities={CITIES} />;
}
