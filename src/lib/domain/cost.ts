export const COST_BANDS = ["free", "low", "moderate", "varies"] as const;
export type CostBand = (typeof COST_BANDS)[number];

/** The only wording used for cost anywhere in the product. */
export const COST_LABELS: Record<CostBand, string> = {
  free: "Free",
  low: "Low cost",
  moderate: "Moderate",
  varies: "Varies",
};

/** Short hint shown next to the label where space allows. */
export const COST_HINTS: Record<CostBand, string> = {
  free: "$0",
  low: "Under $20",
  moderate: "$20 to $50",
  varies: "Depends on the day",
};

const RANK: Record<CostBand, number> = { free: 0, low: 1, moderate: 2, varies: 3 };

export function isCostBand(value: string): value is CostBand {
  return value in RANK;
}

/** Free first, then low, moderate, and varies last because it cannot be promised. */
export function compareCostBands(a: CostBand, b: CostBand): number {
  return RANK[a] - RANK[b];
}

export function costLabel(band: CostBand): string {
  return COST_LABELS[band];
}

/** Share of free places, rounded to a whole percent. */
export function freeShare(bands: readonly CostBand[]): number {
  if (bands.length === 0) return 0;
  const free = bands.filter((b) => b === "free").length;
  return Math.round((free / bands.length) * 100);
}

/**
 * Typical spend per person when a listing gives no price, used only for
 * estimates such as a day plan's running total. Always presented as an estimate, never as a price.
 */
export const TYPICAL_SPEND: Record<CostBand, number> = {
  free: 0,
  low: 10,
  moderate: 30,
  varies: 15,
};
