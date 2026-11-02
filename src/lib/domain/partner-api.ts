import { z } from "zod";
import { CATEGORY_SLUGS } from "./categories";
import { COST_BANDS } from "./cost";
import { PLACE_KINDS } from "./explore-params";

const list = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((s) => s.trim()) : []))
    .pipe(z.array(z.enum(values)));

/** Query string for GET /api/v1/places. Lists are comma-separated. */
export const placesQuerySchema = z.object({
  city: z
    .string()
    .regex(/^[a-z0-9-]+$/, "city must be a city slug")
    .optional(),
  category: list(CATEGORY_SLUGS),
  cost: list(COST_BANDS),
  type: list(PLACE_KINDS),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(50),
});

export const eventsQuerySchema = z.object({
  city: z
    .string()
    .regex(/^[a-z0-9-]+$/, "city must be a city slug")
    .optional(),
  free: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const ATTRIBUTION = {
  source: "CityRoots",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  notice: "Listings from CityRoots (cityroots.ca), CC BY 4.0. Free listings are ordered first.",
} as const;
