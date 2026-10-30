import { compareCostBands, type CostBand } from "./cost";

/**
 * Ranking integrity by construction.
 *
 * This module may only read community and editorial signals. It must never
 * receive payment state, subscription tier, partner status, or claim status.
 * `tests/unit/ranking-integrity.test.ts` fails the build if this type grows a
 * field outside the allowlist or this file mentions a commercial concept.
 */
export type RankingSignals = {
  costBand: CostBand;
  /** Chosen by a curator for being a great first visit. */
  isPick: boolean;
  /** Published community tips. */
  tipCount: number;
  /** Times saved to a collection. */
  saveCount: number;
  /** Last time a curator or the community confirmed the details. */
  lastVerifiedAt: Date | null;
  createdAt: Date;
  /** Full-text match strength for the current query, 0 when there is no query. */
  textScore: number;
};

export const RANKING_SIGNAL_KEYS = [
  "costBand",
  "isPick",
  "tipCount",
  "saveCount",
  "lastVerifiedAt",
  "createdAt",
  "textScore",
] as const satisfies readonly (keyof RankingSignals)[];

const DAY = 86_400_000;

function freshness(date: Date | null, now: Date): number {
  if (!date) return 0;
  const ageDays = Math.max(0, (now.getTime() - date.getTime()) / DAY);
  // Full credit for the first 90 days, fading to nothing over a year.
  if (ageDays <= 90) return 1;
  return Math.max(0, 1 - (ageDays - 90) / 275);
}

/** Relevance score for one listing. Higher is better. */
export function relevanceScore(s: RankingSignals, now: Date = new Date()): number {
  return (
    s.textScore * 4 +
    (s.isPick ? 1.5 : 0) +
    Math.log1p(s.tipCount) * 0.6 +
    Math.log1p(s.saveCount) * 0.8 +
    freshness(s.lastVerifiedAt, now) * 0.7
  );
}

export const SORTS = ["relevance", "cost", "newest"] as const;
export type Sort = (typeof SORTS)[number];

/**
 * Orders listings.
 * - relevance (default): free listings first, then by score.
 * - cost: full band order (free, low, moderate, varies), then by score.
 * - newest: most recently added first.
 * Ties fall back to name so the order is stable.
 */
export function rank<T extends { name: string; signals: RankingSignals }>(
  items: readonly T[],
  sort: Sort = "relevance",
  now: Date = new Date(),
): T[] {
  const scored = items.map((item) => ({ item, score: relevanceScore(item.signals, now) }));
  scored.sort((a, b) => {
    const sa = a.item.signals;
    const sb = b.item.signals;
    let diff = 0;
    if (sort === "newest") diff = sb.createdAt.getTime() - sa.createdAt.getTime();
    else if (sort === "cost") diff = compareCostBands(sa.costBand, sb.costBand);
    else diff = Number(sb.costBand === "free") - Number(sa.costBand === "free");
    if (diff === 0) diff = b.score - a.score;
    if (diff === 0) diff = a.item.name.localeCompare(b.item.name);
    return diff;
  });
  return scored.map((s) => s.item);
}
