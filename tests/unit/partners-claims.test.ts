import { describe, expect, it } from "vitest";
import { claimSchema, emailMatchesWebsite } from "@/lib/domain/claim";
import { placesQuerySchema } from "@/lib/domain/partner-api";
import { generateKey, hashKey, keyFromAuthorization } from "@/lib/domain/partner-keys";

describe("partner keys", () => {
  it("generates keys that parse, with a short prefix and a stable hash", () => {
    const { key, prefix, hash } = generateKey();
    expect(key).toMatch(/^cr_live_[A-Za-z0-9_-]{32}$/);
    expect(key.startsWith(prefix)).toBe(true);
    expect(prefix).toHaveLength(12);
    expect(hash).toBe(hashKey(key));
    expect(hash).not.toContain(key);
    expect(keyFromAuthorization(`Bearer ${key}`)).toBe(key);
  });

  it("rejects malformed authorization headers", () => {
    expect(keyFromAuthorization(null)).toBeNull();
    expect(keyFromAuthorization("cr_live_abc")).toBeNull();
    expect(keyFromAuthorization("Bearer sk_live_whatever")).toBeNull();
  });

  it("issues a different key every time", () => {
    expect(generateKey().key).not.toBe(generateKey().key);
  });
});

describe("claims", () => {
  it("matches work email domains to the listing's website", () => {
    expect(
      emailMatchesWebsite("jo@newmarketlibrary.ca", "https://www.newmarketlibrary.ca/hours"),
    ).toBe(true);
    expect(emailMatchesWebsite("jo@mail.example.org", "https://example.org")).toBe(true);
    expect(emailMatchesWebsite("jo@example.org", "https://shop.example.org")).toBe(true);
    expect(emailMatchesWebsite("jo@gmail.com", "https://gmail.com")).toBe(false);
    expect(emailMatchesWebsite("jo@other.ca", "https://example.org")).toBe(false);
    expect(emailMatchesWebsite("jo@example.org", null)).toBe(false);
    expect(emailMatchesWebsite("jo@example.org", "not a url")).toBe(false);
  });

  it("keeps only the details the claimant filled in", () => {
    const parsed = claimSchema.parse({
      placeId: "00000000-0000-4000-8000-000000000001",
      relationship: "manager",
      hoursText: "Mon to Fri 9am to 5pm",
      costBand: "",
      stepFree: "yes",
      parking: "",
    });
    expect(parsed.hoursText).toBe("Mon to Fri 9am to 5pm");
    expect(parsed.costBand).toBeUndefined();
    expect(parsed.stepFree).toBe(true);
    expect(parsed.parking).toBeUndefined();
  });

  it("refuses insecure websites", () => {
    expect(
      claimSchema.safeParse({
        placeId: "00000000-0000-4000-8000-000000000001",
        relationship: "owner",
        sourceUrl: "http://example.org",
      }).success,
    ).toBe(false);
  });
});

describe("partner API query", () => {
  it("parses comma lists and clamps paging", () => {
    const q = placesQuerySchema.parse({ category: "arts,food", cost: "free", per_page: "20" });
    expect(q.category).toEqual(["arts", "food"]);
    expect(q.cost).toEqual(["free"]);
    expect(q.page).toBe(1);
    expect(q.per_page).toBe(20);
    expect(placesQuerySchema.safeParse({ per_page: "500" }).success).toBe(false);
    expect(placesQuerySchema.safeParse({ category: "casinos" }).success).toBe(false);
  });
});
