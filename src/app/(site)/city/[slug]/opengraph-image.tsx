import { getCityBySlug, listLiveCities } from "@/lib/data/cities";
import { OG_CONTENT_TYPE, OG_SIZE, photoCard } from "@/lib/og";

export const alt = "A city on CityRoots";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 86400;

export async function generateStaticParams() {
  return (await listLiveCities()).map((c) => ({ slug: c.slug }));
}

export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const city = await getCityBySlug((await props.params).slug);
  const freeShare = city?.placeCount ? Math.round((city.freeCount / city.placeCount) * 100) : 0;
  return photoCard({
    photo: city?.heroImage ?? null,
    eyebrow: city?.region ?? "CityRoots",
    title: city ? `Free things to do in ${city.name}` : "Free things to do",
    detail: city ? `${city.placeCount} places, ${freeShare}% of them free` : "",
  });
}
