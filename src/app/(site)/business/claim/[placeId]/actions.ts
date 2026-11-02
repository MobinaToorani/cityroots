"use server";

import type { Route } from "next";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createClaim, getClaimTarget, hasPendingClaim } from "@/lib/data/claims";
import { features } from "@/lib/env";
import { claimSchema, emailMatchesWebsite } from "@/lib/domain/claim";
import { fieldErrors, type FieldErrors } from "@/lib/domain/submission";
import { logger } from "@/lib/logger";
import { notifyReviewers } from "@/lib/notify";
import { consumeRateLimit } from "@/lib/rate-limit";

export type ClaimState = {
  status: "idle" | "error";
  message?: string;
  errors?: FieldErrors;
  values?: Record<string, string>;
};

export async function submitClaim(_prev: ClaimState, formData: FormData): Promise<ClaimState> {
  const values = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
  const placeId = values.placeId ?? "";
  const user = await requireUser(`/business/claim/${placeId}`);
  if (!features.business()) redirect("/");

  const parsed = claimSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "A few things need fixing before we can send this.",
      errors: fieldErrors(parsed.error),
      values,
    };
  }
  const place = await getClaimTarget(parsed.data.placeId);
  if (!place) return { status: "error", message: "We could not find that listing.", values };
  if (place.claimed) {
    return { status: "error", message: "This listing has already been claimed.", values };
  }
  if (await hasPendingClaim(user.id, place.id))
    redirect(`/business/claim/${place.id}?sent=1` as Route);

  const limit = await consumeRateLimit("claim", user.id);
  if (!limit.allowed) {
    return {
      status: "error",
      message: "That is a lot of claims in one day. Try again tomorrow.",
      values,
    };
  }

  const domainMatch = emailMatchesWebsite(user.email, place.sourceUrl);
  let id: string;
  try {
    ({ id } = await createClaim(user.id, parsed.data, domainMatch));
  } catch (error) {
    logger.error("Claim failed", { error });
    return {
      status: "error",
      message: "We could not save this right now. Try again in a minute.",
      values,
    };
  }

  after(async () => {
    try {
      await notifyReviewers(
        `Claim for *${place.name}* (${place.cityName}) by a ${parsed.data.relationship}${domainMatch ? ", email matches the website domain" : ""}. Claim ${id} is waiting for review.`,
      );
    } catch (error) {
      logger.error("Claim notification failed", { error, id });
    }
  });

  redirect(`/business/claim/${place.id}?sent=1` as Route);
}
