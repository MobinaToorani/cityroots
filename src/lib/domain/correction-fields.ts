/** What a correction can be about. Kept free of Zod so client forms stay small. */
export const CORRECTION_FIELDS = [
  "hours",
  "cost",
  "location",
  "closed",
  "description",
  "other",
] as const;

export type CorrectionField = (typeof CORRECTION_FIELDS)[number];

export const CORRECTION_LABELS: Record<CorrectionField, string> = {
  hours: "Hours",
  cost: "Cost or prices",
  location: "Address or location",
  closed: "It has closed",
  description: "Description",
  other: "Something else",
};
