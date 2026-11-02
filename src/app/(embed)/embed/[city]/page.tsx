import { ExternalLink, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryTag, CostBadge } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import { getCityBySlug } from "@/lib/data/cities";
import { queryPlaces } from "@/lib/data/places";
import { features } from "@/lib/env";
import { isCategorySlug } from "@/lib/domain/categories";
import { isCostBand } from "@/lib/domain/cost";
import { defaultExploreState, exploreHref } from "@/lib/domain/explore-params";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = { robots: { index: false } };

function list(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "");
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * The partner widget: a short list of places in one city, free first.
 * Parameters: `cat` and `cost` (comma-separated), `limit` (1 to 20, default 8).
 */
export default async function EmbedCityPage(props: PageProps<"/embed/[city]">) {
  if (!features.partners()) notFound();
  const [{ city: slug }, query] = await Promise.all([props.params, props.searchParams]);
  const city = await getCityBySlug(slug);
  if (!city) notFound();
  const cat = list(query.cat).filter(isCategorySlug);
  const cost = list(query.cost).filter(isCostBand);
  const limit = Math.min(20, Math.max(1, Number(query.limit) || 8));
  const state = defaultExploreState({ city: city.slug, cat, cost });
  const { items, total } = await queryPlaces(state);
  const shown = items.slice(0, limit);
  const more = absoluteUrl(exploreHref(state));

  return (
    <div className="mx-auto max-w-2xl p-4 text-text">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h1 className="text-card font-semibold">Things to do in {city.name}</h1>
        <p className="text-meta text-text-muted">Free things first</p>
      </header>
      {shown.length > 0 ? (
        <ul className="grid gap-2">
          {shown.map((p) => (
            <li
              key={p.id}
              className="grid gap-1 rounded-2xl border border-divider bg-surface-solid px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <a
                  href={absoluteUrl(`/places/${p.id}`)}
                  target="_blank"
                  rel="noopener"
                  className="font-semibold quiet-link"
                >
                  {p.name}
                </a>
                <CostBadge band={p.costBand} className="shrink-0" />
              </div>
              <p className="line-clamp-2 text-meta text-text-muted">{p.summary}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-text-muted">
                <CategoryTag slug={p.category} />
                {p.neighborhood && (
                  <span className="inline-flex items-center gap-1">
                    <Icon icon={MapPin} size={16} />
                    {p.neighborhood}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-divider bg-surface-solid px-4 py-6 text-center text-body">
          Nothing matches here yet.{" "}
          <a
            href={absoluteUrl(`/city/${city.slug}`)}
            target="_blank"
            rel="noopener"
            className="quiet-link"
          >
            See everything in {city.name}
          </a>
        </p>
      )}
      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 text-meta text-text-muted">
        <a
          href={more}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1 font-semibold text-primary-text quiet-link"
        >
          {total > shown.length ? `See all ${total} on CityRoots` : "Open CityRoots"}
          <Icon icon={ExternalLink} size={16} />
        </a>
        <span>
          Listings from CityRoots,{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="license noopener"
            className="quiet-link"
          >
            CC BY 4.0
          </a>
        </span>
      </footer>
    </div>
  );
}
