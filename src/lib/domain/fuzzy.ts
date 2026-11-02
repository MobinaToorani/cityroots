/** Lowercase, strip accents, and collapse punctuation to spaces. */
export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    // Adjacent swap ("musuem" for "museum").
    if (a[i] === b[j + 1] && a[i + 1] === b[j]) {
      i += 2;
      j += 2;
    } else if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function isSubsequence(needle: string, hay: string): boolean {
  let i = 0;
  for (const c of hay) if (c === needle[i]) i++;
  return i === needle.length;
}

/** Score one query token against a text's words. Higher is better; 0 is no match. */
function tokenScore(token: string, text: string, words: string[]): number {
  if (words.some((w) => w === token)) return 10;
  if (words.some((w) => w.startsWith(token))) return 8;
  if (text.includes(token)) return 5;
  if (
    token.length >= 4 &&
    words.some((w) => withinOneEdit(token, w.slice(0, token.length + 1)) || withinOneEdit(token, w))
  )
    return 4;
  if (token.length >= 3 && words.some((w) => w[0] === token[0] && isSubsequence(token, w)))
    return 2;
  return 0;
}

/**
 * Forgiving match for the command palette: every query word must match a word
 * in the text, exactly, as a prefix, inside a word, with one typo, or as an
 * abbreviation ("rh" style subsequences within a word). Returns null on no match.
 */
export function fuzzyScore(query: string, text: string): number | null {
  const q = normalize(query);
  if (!q) return null;
  const t = normalize(text);
  const words = t.split(" ");
  let total = 0;
  for (const token of q.split(" ")) {
    const s = tokenScore(token, t, words);
    if (s === 0) return null;
    total += s;
  }
  // Whole-phrase and start-of-text matches rank first.
  if (t.startsWith(q)) total += 6;
  else if (t.includes(q)) total += 3;
  return total;
}
