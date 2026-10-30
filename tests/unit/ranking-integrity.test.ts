/**
 * Spec rule: ranking reads only community signals. Payment, subscription
 * tier, partner status, and claim status must never become inputs.
 * If this test fails, the change is a spec violation, not a test to update.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RANKING_SIGNAL_KEYS, type RankingSignals } from "@/lib/domain/ranking";

const ALLOWED = [
  "costBand",
  "isPick",
  "tipCount",
  "saveCount",
  "lastVerifiedAt",
  "createdAt",
  "textScore",
];

const FORBIDDEN =
  /stripe|subscri|tier|payment|paid|billing|invoice|partner|claim|premium|\bpro\b|plan|sponsor|promot|boost|advert/i;

function codeWithoutComments(file: string): string {
  return readFileSync(path.resolve(import.meta.dirname, "../../", file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

describe("ranking integrity", () => {
  it("accepts exactly the allowlisted community signals", () => {
    expect([...RANKING_SIGNAL_KEYS].sort()).toEqual([...ALLOWED].sort());
    // Compile-time check: every key of the type is allowlisted and vice versa.
    const exhaustive: Record<keyof RankingSignals, true> = {
      costBand: true,
      isPick: true,
      tipCount: true,
      saveCount: true,
      lastVerifiedAt: true,
      createdAt: true,
      textScore: true,
    };
    expect(Object.keys(exhaustive).sort()).toEqual([...ALLOWED].sort());
  });

  it("ranking code never mentions commercial concepts", () => {
    const code = codeWithoutComments("src/lib/domain/ranking.ts");
    expect(code).not.toMatch(FORBIDDEN);
  });

  it("the explorer query builds signals only from community data", () => {
    const code = codeWithoutComments("src/lib/data/places.ts");
    const signalBlock = /const signals: RankingSignals = \{([\s\S]*?)\};/.exec(code)?.[1] ?? "";
    expect(signalBlock).not.toBe("");
    expect(signalBlock).not.toMatch(FORBIDDEN);
    expect(code).not.toMatch(/subscriptions|claims|partnerKeys/);
  });
});
