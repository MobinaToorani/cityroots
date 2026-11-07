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
    <div className="page-top">
      <Container>
        <h1 className="page-title">Guides</h1>
        <p className="mt-2 text-body text-text-muted">A day out, already planned.</p>
        <ol className="mt-8 grid grid-cols-1 gap-x-12 lg:grid-cols-2">
          {GUIDES.map((g, i) => {
            const city = cities.get(g.city);
            const hero = photo(city?.heroImage ?? null);
            return (
              <li
                key={g.slug}
                className="group relative grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 border-t border-divider py-5 sm:grid-cols-[9rem_minmax(0,1fr)]"
              >
                <div className="relative aspect-[4/3] self-start overflow-hidden rounded-card bg-primary">
                  {hero && <Photo photo={hero} alt="" sizes="9rem" preload={i === 0} />}
                </div>
                <div className="min-w-0">
                  <p className="text-meta text-text-muted">
                    {city?.name}, {budgetLabel(g.budget).toLowerCase()},{" "}
                    {SEASON_LABELS[g.season].toLowerCase()}
                  </p>
                  <h2 className="mt-0.5 text-card font-semibold tracking-tight">
                    <Link
                      href={`/guides/${g.slug}` as Route}
                      prefetch={false}
                      className="group-hover:underline after:absolute after:inset-0"
                    >
                      {g.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-meta text-text-muted">{g.summary}</p>
                  {hero && (
                    <PhotoCredit photo={hero} className="relative z-10 mt-2 text-text-muted" />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </div>
  );
}
