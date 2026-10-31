import type { MetadataRoute } from "next";
import { listLiveCities } from "@/lib/data/cities";
import { listPlaceIds } from "@/lib/data/places";
import { features } from "@/lib/env";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cities, places] = await Promise.all([listLiveCities(), listPlaceIds()]);
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/explore"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/events"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/planner"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/pricing"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/submit"), changeFrequency: "monthly", priority: 0.3 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.4 },
    ...(features.business()
      ? [{ url: absoluteUrl("/business"), changeFrequency: "monthly" as const, priority: 0.3 }]
      : []),
    ...(features.partners()
      ? [{ url: absoluteUrl("/partners"), changeFrequency: "monthly" as const, priority: 0.3 }]
      : []),
    ...cities.flatMap((c) => [
      { url: absoluteUrl(`/city/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.8 },
      {
        url: absoluteUrl(`/explore?city=${c.slug}`),
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
    ]),
    ...places.map((p) => ({
      url: absoluteUrl(`/places/${p.id}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
