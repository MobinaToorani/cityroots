import { z } from "zod";
import { CATEGORY_SLUGS } from "./categories";
import { cleanCopy } from "./copy";
import { CORRECTION_FIELDS } from "./correction-fields";
import { COST_BANDS } from "./cost";
import { PLACE_KINDS } from "./explore-params";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((v) => (v ? cleanCopy(v) : undefined))
    .optional();

const optionalEmail = z
  .union([
    z.literal(""),
    z.email("Enter an email address like name@example.com").trim().toLowerCase(),
  ])
  .optional()
  .transform((v) => v || undefined);

/** Bots fill every field; people never see this one. */
const honeypot = z.string().max(0).optional();

export const newPlaceSchema = z.object({
  type: z.literal("new_place"),
  name: z
    .string("Add the place's name")
    .trim()
    .min(2, "Add the place's name")
    .max(120)
    .transform(cleanCopy),
  city: z.string("Choose a city").trim().min(1, "Choose a city"),
  category: z.enum(CATEGORY_SLUGS, "Choose a category"),
  kind: z.enum(PLACE_KINDS, "Choose what kind of listing this is"),
  costBand: z.enum(COST_BANDS, "Choose what it costs"),
  priceNote: optionalText(160),
  area: z
    .string("Add an address or the neighborhood")
    .trim()
    .min(2, "Add an address or the neighborhood")
    .max(200)
    .transform(cleanCopy),
  hours: optionalText(200),
  description: z
    .string("Tell us a little more, at least a sentence or two")
    .trim()
    .min(20, "Tell us a little more, at least a sentence or two")
    .max(1000, "Keep this under 1000 characters")
    .transform(cleanCopy),
  photoUrl: z
    .union([
      z.literal(""),
      z
        .url("Use a full link starting with https://")
        .startsWith("https://", "Use a link starting with https://"),
    ])
    .optional()
    .transform((v) => v || undefined),
  email: optionalEmail,
  company: honeypot,
});

export const correctionSchema = z.object({
  type: z.literal("correction"),
  placeId: z.uuid("This place could not be found"),
  field: z.enum(CORRECTION_FIELDS, "Choose what needs fixing"),
  details: z
    .string("Tell us what is wrong and what it should say")
    .trim()
    .min(10, "Tell us what is wrong and what it should say")
    .max(1000, "Keep this under 1000 characters")
    .transform(cleanCopy),
  email: optionalEmail,
  company: honeypot,
});

export const submissionSchema = z.discriminatedUnion("type", [newPlaceSchema, correctionSchema]);

export type NewPlaceSubmission = z.infer<typeof newPlaceSchema>;
export type CorrectionSubmission = z.infer<typeof correctionSchema>;
export type Submission = z.infer<typeof submissionSchema>;

export type FieldErrors = Partial<Record<string, string>>;

/** First error message per field, for inline display. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export { CORRECTION_FIELDS, CORRECTION_LABELS } from "./correction-fields";
