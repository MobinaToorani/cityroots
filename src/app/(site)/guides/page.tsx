import type { Metadata, Route } from "next";
import Link from "next/link";
import { GUIDES } from "@/content/guides";
import { Photo, PhotoCredit } from "@/components/features/photo";
import { Container } from "@/components/ui/section";
import { listLiveCities } from "@/lib/data/cities";
import { SEASON_LABELS, budgetLabel } from "@/lib/domain/guides";
import { photo } from "@/lib/photos";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Short, specific plans for free and low-cost days across the GTA and Waterloo Region, written by CityRoots curators.",
  alternates: { canonical: "/guides" },
};

export default async function GuidesPage() {
  const cities = new Map((await listLiveCities()).map((c) => [c.slug, c]));
  return (
    <div className="pt-32 pb-8 color-field">
      <Container className="max-w-4xl">
        <p className="text-meta font-semibold text-primary-text">Guides</p>
        <h1 className="mt-2 font-display text-display font-medium tracking-tight">
          A day out, already planned.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-text-muted">
          Each guide is one specific day in one city, with a budget you can hold to. Every stop is a
          CityRoots listing, so hours and prices stay as current as the listings themselves.
        </p>
        <ol className="mt-12 divide-y divide-divider border-y border-divider">
          {GUIDES.map((g, i) => {
            const city = cities.get(g.city);
            const hero = photo(city?.heroImage ?? null);
            return (
              <li key={g.slug} className="relative grid gap-4 py-6 sm:grid-cols-[12rem_1fr]">
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-primary">
                    {hero && (
                      <Photo
                        photo={hero}
                        alt=""
                        sizes="(min-width: 640px) 12rem, 100vw"
                        // On phones the first photo fills the screen and is the LCP.
                        preload={i === 0}
                      />
                    )}
                  </div>
                  {hero && (
                    <PhotoCredit photo={hero} className="relative z-10 mt-1 text-text-muted" />
                  )}
                </div>
                <div>
                  <p className="text-meta font-semibold text-text-muted">
                    {city?.name}, {budgetLabel(g.budget).toLowerCase()},{" "}
                    {SEASON_LABELS[g.season].toLowerCase()}
                  </p>
                  <h2 className="mt-1 text-card font-semibold">
                    <Link
                      href={`/guides/${g.slug}` as Route}
                      className="after:absolute after:inset-0 hover:underline"
                    >
                      {g.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-body text-text-muted">{g.summary}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </div>
  );
}
