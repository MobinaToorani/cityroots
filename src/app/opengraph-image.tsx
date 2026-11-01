import { getSiteStats } from "@/lib/data/cities";
import { OG_CONTENT_TYPE, OG_SIZE, photoCard } from "@/lib/og";

export const alt = "CityRoots: free and low-cost things to do across the GTA and Waterloo Region";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const stats = await getSiteStats();
  return photoCard({
    photo: "/home/hero.jpg",
    eyebrow: `${stats.cities} cities across the GTA and Waterloo Region`,
    title: "Free things first. Nobody pays for placement.",
    detail: `${stats.places} places, programs, and events, ${stats.freeShare}% of them free`,
  });
}
