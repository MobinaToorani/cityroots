import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/domain/categories";

const css = readFileSync("src/app/globals.css", "utf8");
const darkStart = css.indexOf("@media (prefers-color-scheme: dark)");
const light = css.slice(0, darkStart);
const dark = css.slice(darkStart, css.indexOf("@layer base"));

function token(block: string, name: string): string {
  const match = new RegExp(`--color-${name}: (#[0-9a-f]{6});`).exec(block);
  if (!match?.[1]) throw new Error(`No solid --color-${name}`);
  return match[1];
}

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map(linear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** OKLCH hue in degrees and lightness, to compare colors as the eye does. */
function oklch(hex: string): { lightness: number; hue: number } {
  const [r, g, b] = channels(hex).map(linear) as [number, number, number];
  const l = Math.cbrt(0.4122 * r + 0.5363 * g + 0.0514 * b);
  const m = Math.cbrt(0.2119 * r + 0.6807 * g + 0.1074 * b);
  const s = Math.cbrt(0.0883 * r + 0.2817 * g + 0.63 * b);
  const a = 1.9779 * l - 2.4285 * m + 0.4506 * s;
  const bb = 0.0259 * l + 0.7827 * m - 0.8086 * s;
  return {
    lightness: 0.2104 * l + 0.7936 * m - 0.004 * s,
    hue: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
  };
}

const hueGap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const slugs = CATEGORIES.map((c) => c.slug);

describe("palette", () => {
  it("keeps category colors readable on every surface, in both themes", () => {
    for (const slug of slugs) {
      const inLight = token(light, `cat-${slug}`);
      const inDark = token(dark, `cat-${slug}`);
      expect(contrast(inLight, token(light, "bg")), slug).toBeGreaterThanOrEqual(4.5);
      expect(contrast(inLight, token(light, "surface-solid")), slug).toBeGreaterThanOrEqual(4.5);
      expect(contrast(inDark, token(dark, "bg")), slug).toBeGreaterThanOrEqual(4.5);
      expect(contrast(inDark, token(dark, "surface-solid")), slug).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("gives the categories one lightness, so no tile shouts over the others", () => {
    for (const block of [light, dark]) {
      const values = slugs.map((slug) => oklch(token(block, `cat-${slug}`)).lightness);
      expect(Math.max(...values) - Math.min(...values)).toBeLessThan(0.02);
    }
  });

  it("keeps categories apart from each other", () => {
    const hues = slugs.map((slug) => oklch(token(light, `cat-${slug}`)).hue);
    hues.forEach((a, i) => {
      hues.slice(i + 1).forEach((b) => expect(hueGap(a, b)).toBeGreaterThanOrEqual(24));
    });
  });

  it("leaves green, amber, and red to mean Free, Local pick, and errors", () => {
    const reserved = ["free", "pick", "danger"].map((name) => oklch(token(light, name)).hue);
    for (const slug of slugs) {
      const hue = oklch(token(light, `cat-${slug}`)).hue;
      for (const r of reserved) expect(hueGap(hue, r), slug).toBeGreaterThanOrEqual(14);
    }
  });

  it("keeps the accents used by the map and share images in step with the stylesheet", () => {
    for (const c of CATEGORIES) {
      expect(c.accent.toLowerCase()).toBe(token(light, `cat-${c.slug}`));
    }
  });
});
