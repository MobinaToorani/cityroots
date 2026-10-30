import { CATEGORIES } from "@/lib/domain/categories";

/** OpenFreeMap: free vector tiles with no API key or billing (see DECISIONS.md). */
export const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

export const MAP_FONT = ["Noto Sans Bold"];

/** Whole explorer area, used when nothing narrower is known. */
export const DEFAULT_BOUNDS: [[number, number], [number, number]] = [
  [-80.6, 43.2],
  [-79.1, 44.2],
];

/** MapLibre "match" expression colouring pins by category accent. */
export function categoryColorExpression(): unknown[] {
  return [
    "match",
    ["get", "category"],
    ...CATEGORIES.flatMap((c) => [c.slug, c.accent]),
    "#1E4D36",
  ];
}

/** Rounds bounds so tiny pans do not churn the URL. */
export function roundBbox(b: [number, number, number, number]): [number, number, number, number] {
  return b.map((v) => Math.round(v * 1000) / 1000) as [number, number, number, number];
}
