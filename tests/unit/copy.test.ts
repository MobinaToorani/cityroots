import { describe, expect, it } from "vitest";
import { cleanCopy, firstSentence, slugify } from "@/lib/domain/copy";

const EM = "—";

describe("cleanCopy", () => {
  it("turns a single em dash into a colon", () => {
    expect(cleanCopy(`Summer weekends ${EM} food trucks and music.`)).toBe(
      "Summer weekends: food trucks and music.",
    );
  });

  it("turns a paired aside into commas", () => {
    expect(cleanCopy(`The lake ${EM} a glacial kettle ${EM} is lovely.`)).toBe(
      "The lake, a glacial kettle, is lovely.",
    );
  });

  it("never leaves an em dash or stray punctuation", () => {
    const out = cleanCopy(`${EM} Seasonal ${EM}`);
    expect(out).not.toContain(EM);
    expect(out).toBe("Seasonal");
  });

  it("replaces the banned phrase hidden gem", () => {
    expect(cleanCopy("A true hidden gem. Hidden gems abound.")).toBe(
      "A true local favorite. Local favorites abound.",
    );
  });
});

describe("firstSentence", () => {
  it("returns the first sentence", () => {
    expect(firstSentence("One here. Two there.")).toBe("One here.");
  });
  it("returns the whole text when there is one sentence", () => {
    expect(firstSentence("Just one")).toBe("Just one");
  });
});

describe("slugify", () => {
  it("makes readable URL slugs", () => {
    expect(slugify("Café & Books: St. Jacob's")).toBe("cafe-and-books-st-jacobs");
  });
});

describe("banned marketing verbs", () => {
  it("swaps them for plain words", () => {
    expect(cleanCopy("The clinic can unlock refunds and elevate your week.")).toBe(
      "The clinic can open up refunds and lift your week.",
    );
  });
});
