import { describe, expect, it } from "vitest";
import { slidingWindowCount, windowStart } from "@/lib/domain/rate-limit-math";

describe("sliding window", () => {
  const minute = 60_000;

  it("counts all of the previous window at the start of a new one", () => {
    expect(slidingWindowCount(1, 10, 0, minute)).toBe(11);
  });

  it("phases the previous window out linearly", () => {
    expect(slidingWindowCount(2, 10, minute / 2, minute)).toBe(7);
    expect(slidingWindowCount(2, 10, minute, minute)).toBe(2);
  });

  it("aligns window starts", () => {
    expect(windowStart(125_000, minute)).toBe(120_000);
  });
});
