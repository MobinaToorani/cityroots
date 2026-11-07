import { getPlace } from "@/lib/data/places";
import { categoryMeta } from "@/lib/domain/categories";
import { COST_LABELS } from "@/lib/domain/cost";
import { OG_CONTENT_TYPE, OG_SIZE, placeCard } from "@/lib/og";

export const alt = "A place on CityRoots";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
// Rendered on first request and cached for a day, rather than 400 images at build time.
export const revalidate = 86400;

export function generateStaticParams() {
  return [];
}

export default async function Image(props: { params: Promise<{ id: string }> }) {
  const place = await getPlace((await props.params).id);
  if (!place) {
    return placeCard({
      name: "CityRoots",
      where: "Free and low-cost things to do",
      cost: "Free",
      free: true,
      category: "Places",
      accent: "#17456e",
    });
  }
  const category = categoryMeta(place.category);
  return placeCard({
    name: place.name,
    where: [place.neighborhood, place.cityName].filter(Boolean).join(", "),
    cost: COST_LABELS[place.costBand],
    free: place.costBand === "free",
    category: category.shortName,
    accent: category.accent,
  });
}
