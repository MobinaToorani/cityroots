import { listLiveCities } from "@/lib/data/cities";
import { apiJson, withPartner } from "@/lib/partner-api/guard";
import { absoluteUrl } from "@/lib/site";

/** Live cities with listing counts. Any valid key may read these. */
export function GET(request: Request) {
  return withPartner(request, null, async () => {
    const cities = await listLiveCities();
    return apiJson({
      data: cities.map((c) => ({
        slug: c.slug,
        name: c.name,
        region: c.region,
        places: c.placeCount,
        freePlaces: c.freeCount,
        url: absoluteUrl(`/city/${c.slug}`),
      })),
    });
  });
}
