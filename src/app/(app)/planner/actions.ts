"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCityBySlug } from "@/lib/data/cities";
import { getPlaceCards } from "@/lib/data/places";
import { createPlan, deletePlan } from "@/lib/data/planner";
import { getMembership } from "@/lib/data/subscriptions";
import {
  estimateCost,
  planTitle,
  savePlanSchema,
  slotLabel,
  SLOT_TIMES,
} from "@/lib/domain/planner";
import { logger } from "@/lib/logger";

export type SavePlanState = { status: "idle" | "error"; message?: string };

/**
 * Saves the plan as the member arranged it. Costs and times are worked out
 * again here; nothing about price is taken from the browser.
 */
export async function savePlanAction(
  _prev: SavePlanState,
  formData: FormData,
): Promise<SavePlanState> {
  const user = await requireUser("/planner");
  if (!(await getMembership(user.id)).pro) redirect("/pricing");

  let stops: unknown;
  try {
    stops = JSON.parse(String(formData.get("stops") ?? "[]"));
  } catch {
    return {
      status: "error",
      message: "The plan could not be read. Reload the page and try again.",
    };
  }
  const parsed = savePlanSchema.safeParse({
    city: formData.get("city"),
    day: formData.get("day"),
    budget: formData.get("budget"),
    interests: formData.getAll("interests"),
    stops,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the plan and try again.",
    };
  }
  const input = parsed.data;
  const city = await getCityBySlug(input.city);
  if (!city) return { status: "error", message: "That city is not on CityRoots." };

  const cards = new Map(
    (await getPlaceCards(input.stops.map((s) => s.placeId))).map((c) => [c.id, c]),
  );
  const kept = input.stops.filter((s) => cards.get(s.placeId)?.citySlug === city.slug);
  if (kept.length === 0) {
    return {
      status: "error",
      message: "None of these places are listed any more. Plan the day again.",
    };
  }

  let shareId: string;
  try {
    ({ shareId } = await createPlan({
      userId: user.id,
      cityId: city.id,
      title: planTitle(input.day, city.name),
      day: input.day,
      budget: input.budget,
      interests: input.interests,
      stops: kept.map((s, i) => {
        const card = cards.get(s.placeId);
        return {
          placeId: s.placeId,
          slot: slotLabel(s.slot),
          time: SLOT_TIMES[i] ?? SLOT_TIMES[SLOT_TIMES.length - 1] ?? "18:30",
          estimate: card ? estimateCost(card) : 0,
        };
      }),
    }));
  } catch (error) {
    logger.error("Could not save plan", { error });
    return { status: "error", message: "The plan did not save. Try again in a minute." };
  }
  redirect(`/plans/${shareId}?saved=1` as Route);
}

export async function deletePlanAction(formData: FormData): Promise<void> {
  const user = await requireUser("/planner");
  await deletePlan(user.id, String(formData.get("shareId") ?? ""));
  redirect("/planner?deleted=1");
}
