"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { cityExists, createSubmission, getPlaceRef } from "@/lib/data/submissions";
import {
  CORRECTION_LABELS,
  fieldErrors,
  submissionSchema,
  type FieldErrors,
} from "@/lib/domain/submission";
import { emailHtml, escapeHtml, sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { notifyReviewers } from "@/lib/notify";
import { clientFingerprint, consumeRateLimit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/site";

export type SubmitState = {
  status: "idle" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echo of what was typed, so a failed submit never loses work. */
  values?: Record<string, string>;
};

export async function submitListing(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const values = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
  const parsed = submissionSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "A few things need fixing before we can send this.",
      errors: fieldErrors(parsed.error),
      values,
    };
  }
  const input = parsed.data;

  if (input.type === "new_place" && !(await cityExists(input.city))) {
    return { status: "error", errors: { city: "Choose a city from the list" }, values };
  }
  const place = input.type === "correction" ? await getPlaceRef(input.placeId) : null;
  if (input.type === "correction" && !place) {
    return {
      status: "error",
      message: "We could not find that place. It may have been removed.",
      values,
    };
  }

  const limit = await consumeRateLimit("submit", await clientFingerprint());
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return {
      status: "error",
      message: `That is a lot of submissions in a short time. Try again in about ${minutes} minutes.`,
      values,
    };
  }

  let id: string;
  try {
    ({ id } = await createSubmission(input));
  } catch (error) {
    logger.error("Submission failed", { error, type: input.type });
    return {
      status: "error",
      message: "We could not save this right now. Try again in a minute.",
      values,
    };
  }

  const summary =
    input.type === "new_place"
      ? `New place suggested: *${input.name}* (${input.city}, ${input.category}, ${input.costBand})`
      : `Correction for *${place?.name}* (${place?.cityName}): ${CORRECTION_LABELS[input.field]}\n> ${input.details}`;

  // Notify after the response is sent, so slow integrations never slow the form.
  after(async () => {
    try {
      await notifyReviewers(`${summary}\nSubmission ${id} is waiting for review.`);
    } catch (error) {
      logger.error("Review notification failed", { error, id });
    }
    if (input.email) {
      try {
        const what = input.type === "new_place" ? input.name : `your correction to ${place?.name}`;
        await sendEmail({
          to: input.email,
          subject: "We got your CityRoots suggestion",
          text: `Thanks for suggesting ${what}. A curator reviews every suggestion before it goes live, usually within a week. We will email you when it has been reviewed.\n\n${absoluteUrl("/explore")}`,
          html: emailHtml(
            "Thanks, we got it",
            [
              `Thanks for suggesting ${escapeHtml(what)}.`,
              "A curator reviews every suggestion before it goes live, usually within a week. We will email you when it has been reviewed.",
            ],
            { href: absoluteUrl("/explore"), label: "Keep exploring" },
          ),
        });
      } catch (error) {
        logger.error("Submission receipt email failed", { error, id });
      }
    }
  });

  redirect(`/submit/thanks?type=${input.type}`);
}
