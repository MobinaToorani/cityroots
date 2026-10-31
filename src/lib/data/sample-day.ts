import "server-only";
import {
  assemblePlan,
  nextSaturday,
  timeLabel,
  torontoDay,
  weekdayOf,
  type PlannerCandidate,
} from "@/lib/domain/planner";
import { listPlannerCandidates } from "./planner";

export type SampleStop = {
  time: string;
  label: string;
  estimate: number;
  place: Pick<PlannerCandidate, "id" | "name" | "costBand">;
};

export type SampleDay = { stops: SampleStop[]; total: number; budget: number };

/** What the Day Planner builds for the coming Saturday, for previews on public pages. */
export async function sampleDay(citySlug: string, budget = 25): Promise<SampleDay> {
  const day = nextSaturday(torontoDay(new Date()));
  const candidates = await listPlannerCandidates(citySlug, day);
  const plan = assemblePlan({ candidates, budget, interests: [], weekday: weekdayOf(day) });
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const stops = plan.stops.flatMap((s) => {
    const c = byId.get(s.placeId);
    return c
      ? [
          {
            time: timeLabel(s.time),
            label: s.label,
            estimate: s.estimate,
            place: { id: c.id, name: c.name, costBand: c.costBand },
          },
        ]
      : [];
  });
  return { stops, total: plan.total, budget };
}
