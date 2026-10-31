import { z } from "zod";
import { CATEGORY_SLUGS } from "./categories";
import { cleanCopy, firstSentence } from "./copy";
import { COST_BANDS } from "./cost";
import { PLACE_KINDS } from "./explore-params";

const text = (label: string, min: number, max: number) =>
  z
    .string(`Add ${label}`)
    .trim()
    .min(min, `Add ${label}`)
    .max(max, `Keep ${label} under ${max} characters`)
    .transform(cleanCopy);

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((v) => (v ? cleanCopy(v) : null))
    .optional()
    .transform((v) => v ?? null);

const coordinate = (min: number, max: number) =>
  z
    .union([z.literal(""), z.coerce.number().min(min).max(max)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));

/** A place as a curator publishes or corrects it. */
export const placeEditSchema = z
  .object({
    name: text("a name", 2, 120),
    citySlug: z.string().min(1, "Choose a city"),
    category: z.enum(CATEGORY_SLUGS, "Choose a category"),
    kind: z.enum(PLACE_KINDS, "Choose a kind"),
    costBand: z.enum(COST_BANDS, "Choose a cost band"),
    priceNote: optional(160),
    summary: optional(200),
    description: text("a description", 20, 2000),
    neighborhood: optional(120),
    address: optional(200),
    hoursText: optional(200),
    sourceUrl: z
      .union([z.literal(""), z.url("Use a full link").startsWith("https://", "Use https://")])
      .optional()
      .transform((v) => v || null),
    phone: optional(40),
    lat: coordinate(41, 57),
    lng: coordinate(-96, -74),
    notes: optional(1000),
  })
  .transform((v) => ({ ...v, summary: v.summary ?? firstSentence(v.description) }));

export type PlaceEdit = z.infer<typeof placeEditSchema>;

export const reviewNotesSchema = z
  .string()
  .trim()
  .max(1000, "Keep notes under 1000 characters")
  .transform((v) => (v ? cleanCopy(v) : null));
