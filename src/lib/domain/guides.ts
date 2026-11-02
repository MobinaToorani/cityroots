import { z } from "zod";

export const GUIDE_SEASONS = ["any", "spring", "summer", "fall", "winter"] as const;

export const SEASON_LABELS: Record<(typeof GUIDE_SEASONS)[number], string> = {
  any: "Any time of year",
  spring: "Best in spring",
  summer: "Best in summer",
  fall: "Best in fall",
  winter: "Best in winter",
};

/** Guide metadata. Kept in TypeScript so it is type-checked and testable without MDX. */
export const guideMetaSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(10).max(80),
  /** One or two sentences for cards, search results, and link previews. */
  summary: z.string().min(40).max(200),
  city: z.string().regex(/^[a-z0-9-]+$/),
  /** Most you should spend, in dollars, for the whole guide. 0 means all free. */
  budget: z.number().int().min(0).max(100),
  season: z.enum(GUIDE_SEASONS),
  publishedAt: z.iso.date(),
  updatedAt: z.iso.date(),
  /** Place slugs in the city, in the order the guide visits them. */
  stops: z
    .array(z.string().regex(/^[a-z0-9-]+$/))
    .min(3)
    .max(10),
});

export type GuideMeta = z.infer<typeof guideMetaSchema>;

export function budgetLabel(budget: number): string {
  return budget === 0 ? "All free" : `Under $${budget}`;
}
