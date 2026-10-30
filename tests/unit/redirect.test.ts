import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/auth/redirect";

describe("safeRedirectPath", () => {
  it("allows same-site paths", () => {
    expect(safeRedirectPath("/explore?city=waterloo")).toBe("/explore?city=waterloo");
  });
  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    42,
    null,
  ])("rejects %s", (value) => {
    expect(safeRedirectPath(value)).toBe("/account");
  });
});
