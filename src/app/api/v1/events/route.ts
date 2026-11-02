import { listUpcomingEvents } from "@/lib/data/events";
import { eventsQuerySchema } from "@/lib/domain/partner-api";
import { apiError, apiJson, withPartner } from "@/lib/partner-api/guard";

/** Upcoming recurring events. `precision: "month"` means only the month is known. */
export function GET(request: Request) {
  return withPartner(request, "events:read", async (_partner, url) => {
    const parsed = eventsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return apiError(400, "invalid_query", parsed.error.issues[0]?.message ?? "Invalid query");
    }
    const { city, free, limit } = parsed.data;
    const events = await listUpcomingEvents({ city, freeOnly: free, limit });
    return apiJson({
      data: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        city: e.citySlug,
        cost: e.costBand,
        startsAt: e.startAt.toISOString(),
        endsAt: e.endAt?.toISOString() ?? null,
        precision: e.precision,
        placeId: e.placeId,
      })),
    });
  });
}
