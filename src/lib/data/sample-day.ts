import "server-only";
import type { CategorySlug } from "@/lib/domain/categories";
import { defaultExploreState } from "@/lib/domain/explore-params";
import { queryPlaces } from "./places";
import type { PlaceCard } from "./types";

export type SampleStop = { time: string; label: string; place: PlaceCard };

const SLOTS: { time: string; label: string; cat: CategorySlug }[] = [
  { time: "9:30", label: "Morning coffee", cat: "cafes" },
  { time: "11:00", label: "Get outside", cat: "physical" },
  { time: "13:00", label: "Lunch", cat: "food" },
  { time: "15:00", label: "Afternoon stop", cat: "arts" },
  { time: "18:30", label: "Evening", cat: "social" },
];

/**
 * A simple preview of a day out, built from the top-ranked listing in each
 * slot. The full Day Planner (budget, interests, reordering) builds on this.
 */
export async function sampleDay(citySlug: string): Promise<SampleStop[]> {
  const stops = await Promise.all(
    SLOTS.map(async (slot) => {
      const { items } = await queryPlaces(
        defaultExploreState({
          city: citySlug,
          cat: [slot.cat],
          cost: ["free", "low"],
          type: ["place"],
        }),
      );
      const place = items[0];
      return place ? { time: slot.time, label: slot.label, place } : null;
    }),
  );
  return stops.filter((s): s is SampleStop => s !== null);
}
