import { describe, expect, it } from "vitest";
import { fieldErrors, submissionSchema } from "@/lib/domain/submission";

const place = {
  type: "new_place",
  name: "Waterloo Community Garden",
  city: "waterloo",
  category: "physical",
  kind: "place",
  costBand: "free",
  area: "Uptown Waterloo",
  description: "Free plots and weekend workdays open to anyone who wants to learn.",
  company: "",
};

describe("submissionSchema", () => {
  it("accepts a complete new place and drops empty optionals", () => {
    const r = submissionSchema.safeParse({ ...place, email: "", photoUrl: "", hours: "" });
    expect(r.success).toBe(true);
    if (r.success && r.data.type === "new_place") {
      expect(r.data.email).toBeUndefined();
      expect(r.data.photoUrl).toBeUndefined();
    }
  });

  it("cleans copy rules out of community text", () => {
    const r = submissionSchema.safeParse({
      ...place,
      description: "A hidden gem — great for families and kids.",
    });
    expect(r.success && r.data.type === "new_place" && r.data.description).toBe(
      "A local favorite: great for families and kids.",
    );
  });

  it("rejects bots that fill the honeypot", () => {
    expect(submissionSchema.safeParse({ ...place, company: "Acme" }).success).toBe(false);
  });

  it("rejects non-https photo links and unknown cost bands", () => {
    expect(
      submissionSchema.safeParse({ ...place, photoUrl: "http://example.com/a.jpg" }).success,
    ).toBe(false);
    expect(submissionSchema.safeParse({ ...place, costBand: "cheap" }).success).toBe(false);
  });

  it("gives one friendly message per field", () => {
    const r = submissionSchema.safeParse({ type: "new_place", company: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errors = fieldErrors(r.error);
      expect(Object.keys(errors)).toEqual(
        expect.arrayContaining(["name", "city", "category", "costBand", "description"]),
      );
      for (const message of Object.values(errors)) expect(message).not.toMatch(/Invalid|expected/i);
    }
  });

  it("validates corrections against a real place id", () => {
    const base = {
      type: "correction",
      field: "hours",
      details: "Now closed on Mondays, see the website.",
      company: "",
    };
    expect(submissionSchema.safeParse({ ...base, placeId: "not-a-uuid" }).success).toBe(false);
    expect(
      submissionSchema.safeParse({ ...base, placeId: "3ccc04cb-2caa-5181-841e-14143bf5a9c6" })
        .success,
    ).toBe(true);
  });
});
