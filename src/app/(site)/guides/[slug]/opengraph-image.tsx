import { GUIDES, getGuide } from "@/content/guides";
import { getCityBySlug } from "@/lib/data/cities";
import { SEASON_LABELS } from "@/lib/domain/guides";
import { OG_CONTENT_TYPE, OG_SIZE, photoCard } from "@/lib/og";

export const alt = "A CityRoots guide";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await props.params).slug);
  const city = guide ? await getCityBySlug(guide.city) : null;
  return photoCard({
    photo: city?.heroImage ?? null,
    eyebrow: city ? `A guide to ${city.name}` : "A CityRoots guide",
    title: guide?.title ?? "CityRoots guides",
    detail: guide
      ? `${guide.stops.length} stops, ${SEASON_LABELS[guide.season].toLowerCase()}`
      : "",
  });
}
