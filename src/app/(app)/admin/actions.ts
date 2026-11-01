"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { approveClaim, getClaim, rejectClaim, type ClaimField } from "@/lib/data/claims";
import { issuePartnerKey, revokePartnerKey } from "@/lib/data/partners";
import {
  getSubmission,
  publishSuggestedPlace,
  rejectSubmission,
  resolveCorrection,
} from "@/lib/data/review";
import { emailHtml, escapeHtml, sendEmail } from "@/lib/email";
import { features } from "@/lib/env";
import { isPartnerScope } from "@/lib/domain/partner-keys";
import { placeEditSchema, reviewNotesSchema } from "@/lib/domain/review";
import { fieldErrors, type FieldErrors } from "@/lib/domain/submission";
import { logger } from "@/lib/logger";
import { absoluteUrl } from "@/lib/site";

export type EditState = {
  status: "idle" | "error";
  message?: string;
  errors?: FieldErrors;
  values?: Record<string, string>;
};

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function stringValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
}

/**
 * A changed or closed place also shows on city pages and the home page, which
 * are cached for an hour. The edit may move it between cities, so refresh all.
 */
function revalidatePlace(placeId: string) {
  revalidatePath(`/places/${placeId}`);
  revalidatePath("/city/[slug]", "page");
  revalidatePath("/");
}

/** Tells a contributor what happened, after the response is sent. */
function emailOutcome(
  to: string | null,
  subject: string,
  lines: string[],
  link?: { href: string; label: string },
) {
  if (!to) return;
  after(async () => {
    try {
      await sendEmail({
        to,
        subject,
        text: [...lines, link ? link.href : ""].filter(Boolean).join("\n\n"),
        html: emailHtml(subject, lines.map(escapeHtml), link),
      });
    } catch (error) {
      logger.error("Review outcome email failed", { error, subject });
    }
  });
}

/* ------------------------------------------------------------------ */
/* Suggestions                                                          */
/* ------------------------------------------------------------------ */

export async function publishSubmissionAction(
  _prev: EditState,
  formData: FormData,
): Promise<EditState> {
  const reviewer = await requireRole("curator", "/admin/submissions");
  const values = stringValues(formData);
  const submission = await getSubmission(text(formData, "submissionId"));
  if (!submission || submission.status !== "pending") {
    return { status: "error", message: "This suggestion was already reviewed.", values };
  }
  const parsed = placeEditSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Fix the highlighted fields.",
      errors: fieldErrors(parsed.error),
      values,
    };
  }
  let placeId: string;
  try {
    ({ placeId } = await publishSuggestedPlace(submission.id, reviewer.id, parsed.data));
  } catch (error) {
    logger.error("Publish failed", { error, submissionId: submission.id });
    return { status: "error", message: "Publishing failed. Check the city and try again.", values };
  }
  revalidatePath(`/city/${parsed.data.citySlug}`);
  revalidatePath("/");
  emailOutcome(
    submission.contactEmail,
    `${parsed.data.name} is on CityRoots`,
    [
      `Thanks for suggesting ${parsed.data.name}. A curator checked it and it is now listed.`,
      ...(parsed.data.notes ? [`Note from the curator: ${parsed.data.notes}`] : []),
    ],
    { href: absoluteUrl(`/places/${placeId}`), label: "See the listing" },
  );
  redirect("/admin/submissions?done=published");
}

export async function applyCorrectionAction(
  _prev: EditState,
  formData: FormData,
): Promise<EditState> {
  const reviewer = await requireRole("curator", "/admin/submissions");
  const values = stringValues(formData);
  const submission = await getSubmission(text(formData, "submissionId"));
  if (!submission?.placeId || submission.status !== "pending") {
    return { status: "error", message: "This correction was already reviewed.", values };
  }
  const intent = text(formData, "intent");
  const notes = reviewNotesSchema.safeParse(text(formData, "notes"));
  let edit = null;
  if (intent === "apply") {
    const parsed = placeEditSchema.safeParse(values);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Fix the highlighted fields.",
        errors: fieldErrors(parsed.error),
        values,
      };
    }
    edit = parsed.data;
  }
  try {
    await resolveCorrection({
      submissionId: submission.id,
      placeId: submission.placeId,
      reviewerId: reviewer.id,
      edit,
      closePlace: intent === "close",
      notes: notes.success ? notes.data : null,
    });
  } catch (error) {
    logger.error("Correction failed", { error, submissionId: submission.id });
    return { status: "error", message: "Saving failed. Try again.", values };
  }
  revalidatePlace(submission.placeId);
  emailOutcome(
    submission.contactEmail,
    `Your correction to ${submission.placeName ?? "a listing"}`,
    [
      intent === "close"
        ? `Thanks for letting us know. ${submission.placeName} has been taken off CityRoots.`
        : `Thanks for the correction. A curator reviewed it and the listing is up to date.`,
    ],
    intent === "close"
      ? undefined
      : { href: absoluteUrl(`/places/${submission.placeId}`), label: "See the listing" },
  );
  redirect("/admin/submissions?done=corrected");
}

export async function rejectSubmissionAction(formData: FormData): Promise<void> {
  const reviewer = await requireRole("curator", "/admin/submissions");
  const submission = await getSubmission(text(formData, "submissionId"));
  if (!submission) redirect("/admin/submissions");
  const notes = reviewNotesSchema.safeParse(text(formData, "notes"));
  const note = notes.success ? notes.data : null;
  const done = await rejectSubmission(submission.id, reviewer.id, note);
  if (done) {
    const name =
      submission.type === "new_place"
        ? String(submission.payload.name ?? "your suggestion")
        : `your correction to ${submission.placeName ?? "a listing"}`;
    emailOutcome(submission.contactEmail, "About your CityRoots suggestion", [
      `Thanks for sending ${name}. A curator reviewed it and it will not be added this time.`,
      note
        ? `Why: ${note}`
        : "Usually that means it is not free or low cost, or we could not confirm the details.",
    ]);
  }
  redirect("/admin/submissions?done=rejected");
}

/* ------------------------------------------------------------------ */
/* Claims                                                               */
/* ------------------------------------------------------------------ */

const CLAIM_FIELDS: readonly ClaimField[] = [
  "hoursText",
  "costBand",
  "priceNote",
  "sourceUrl",
  "accessibility",
];

export async function approveClaimAction(formData: FormData): Promise<void> {
  const reviewer = await requireRole("curator", "/admin/claims");
  const apply = formData
    .getAll("apply")
    .filter((v): v is ClaimField => CLAIM_FIELDS.includes(v as ClaimField));
  const notes = reviewNotesSchema.safeParse(text(formData, "notes"));
  const result = await approveClaim({
    claimId: text(formData, "claimId"),
    reviewerId: reviewer.id,
    apply,
    notes: notes.success ? notes.data : null,
  });
  if (result) {
    revalidatePlace(result.placeId);
    emailOutcome(
      result.claimantEmail,
      `You manage ${result.placeName} on CityRoots`,
      [
        `Your claim for ${result.placeName} is verified, and the details you confirmed are live.`,
        "To change anything later, use Suggest a correction on the listing and mention that you run it.",
      ],
      { href: absoluteUrl(`/places/${result.placeId}`), label: "See your listing" },
    );
  }
  redirect("/admin/claims?done=verified");
}

export async function rejectClaimAction(formData: FormData): Promise<void> {
  const reviewer = await requireRole("curator", "/admin/claims");
  const claim = await getClaim(text(formData, "claimId"));
  if (!claim) redirect("/admin/claims");
  const notes = reviewNotesSchema.safeParse(text(formData, "notes"));
  const note = notes.success ? notes.data : null;
  if (await rejectClaim(claim.id, reviewer.id, note)) {
    emailOutcome(claim.claimantEmail, `Your claim for ${claim.placeName}`, [
      `We could not confirm your claim for ${claim.placeName}.`,
      note ?? "If you do run it, reply to this email with a phone number we can reach you on.",
    ]);
  }
  redirect("/admin/claims?done=rejected");
}

/* ------------------------------------------------------------------ */
/* Partner keys                                                         */
/* ------------------------------------------------------------------ */

export type IssueKeyState = {
  status: "idle" | "error" | "issued";
  message?: string;
  key?: string;
  orgName?: string;
};

export async function issueKeyAction(
  _prev: IssueKeyState,
  formData: FormData,
): Promise<IssueKeyState> {
  const admin = await requireRole("admin", "/admin/partners");
  if (!features.partners()) return { status: "error", message: "The partner program is off." };
  const orgName = text(formData, "orgName").trim().slice(0, 120);
  const contactEmail = text(formData, "contactEmail").trim().toLowerCase().slice(0, 200) || null;
  const scopes = formData
    .getAll("scopes")
    .filter((s): s is string => typeof s === "string")
    .filter(isPartnerScope);
  if (orgName.length < 2) return { status: "error", message: "Add the organization's name." };
  if (scopes.length === 0) return { status: "error", message: "Choose at least one scope." };
  try {
    const { key } = await issuePartnerKey({ orgName, contactEmail, scopes, createdBy: admin.id });
    return { status: "issued", key, orgName };
  } catch (error) {
    logger.error("Issuing a partner key failed", { error });
    return { status: "error", message: "The key was not created. Try again." };
  }
}

export async function revokeKeyAction(formData: FormData): Promise<void> {
  await requireRole("admin", "/admin/partners");
  await revokePartnerKey(text(formData, "keyId"));
  redirect("/admin/partners?done=revoked" as Route);
}
