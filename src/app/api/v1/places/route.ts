import { listPlacesForPartners } from "@/lib/data/places";
import { defaultExploreState } from "@/lib/domain/explore-params";
import { placesQuerySchema } from "@/lib/domain/partner-api";
import { apiError, apiJson, withPartner } from "@/lib/partner-api/guard";
import { absoluteUrl } from "@/lib/site";

/** Published places, free first, then community signals. Same order as the site. */
export function GET(request: Request) {
  return withPartner(request, "places:read", async (_partner, url) => {
    const parsed = placesQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return apiError(400, "invalid_query", parsed.error.issues[0]?.message ?? "Invalid query");
    }
    const q = parsed.data;
    const { items, total } = await listPlacesForPartners(
      defaultExploreState({
        city: q.city ?? null,
        cat: q.category,
        cost: q.cost,
        type: q.type,
        q: q.q ?? "",
      }),
      (q.page - 1) * q.per_page,
      q.per_page,
    );
    return apiJson({
      data: items.map((p) => ({
        id: p.id,
        name: p.name,
        summary: p.summary,
        kind: p.kind,
        category: p.category,
        cost: p.costBand,
        priceNote: p.priceNote,
        city: p.citySlug,
        neighborhood: p.neighborhood,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        hours: p.hours,
        website: p.website,
        pick: p.isPick,
        url: absoluteUrl(`/places/${p.id}`),
        updatedAt: p.updatedAt.toISOString(),
      })),
      meta: { page: q.page, perPage: q.per_page, total, hasMore: q.page * q.per_page < total },
    });
  });
}
