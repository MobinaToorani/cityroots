/**
 * House style for user-facing copy. Applied to seed data and community
 * submissions before they are stored.
 */
const EM_DASH = "\u2014";

const REPLACEMENTS: [RegExp, string][] = [
  // No em dashes. A paired aside becomes commas; a single dash introduces
  // what follows, so it becomes a colon.
  [new RegExp(`\\s*${EM_DASH}\\s*([^${EM_DASH}.!?]+?)\\s*${EM_DASH}\\s*`, "g"), ", $1, "],
  [new RegExp(`\\s*${EM_DASH}\\s*`, "g"), ": "],
  [/\bHidden gems\b/g, "Local favorites"],
  [/\bhidden gems\b/gi, "local favorites"],
  [/\bHidden gem\b/g, "Local favorite"],
  [/\bhidden gem\b/gi, "local favorite"],
  // Other banned marketing verbs, swapped for plain ones.
  [/\bunlocks\b/gi, "opens up"],
  [/\bunlock\b/gi, "open up"],
  [/\bseamless(ly)?\b/gi, "smooth$1"],
  [/\belevates\b/gi, "lifts"],
  [/\belevate\b/gi, "lift"],
];

export function cleanCopy(input: string): string {
  let out = input;
  for (const [pattern, replacement] of REPLACEMENTS) out = out.replace(pattern, replacement);
  // A replaced dash at the very start or end leaves stray punctuation.
  return out
    .replace(/^[,:]\s*/, "")
    .replace(/[,:]\s*$/, "")
    .replace(/[,:]\s*([.!?])/g, "$1");
}

/** First sentence, used as a one-line hook on cards. */
export function firstSentence(text: string): string {
  const match = /^(.+?[.!?])(?=\s+[A-Z(]|$)/.exec(text.trim());
  return (match?.[1] ?? text).trim();
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
