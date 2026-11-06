import { describe, expect, it } from "vitest";
import {
  buildAgenda,
  deriveEventDates,
  eventDateLabel,
  monthsCovered,
  whenRange,
} from "@/lib/domain/event-dates";

const today = new Date("2026-10-30T12:00:00Z");
const iso = (d: Date | undefined) => d?.toISOString().slice(0, 10);

describe("deriveEventDates", () => {
  it("turns a month range into the current or next season", () => {
    const d = deriveEventDates("Saturdays May through October", today);
    expect(d?.precision).toBe("month");
    expect(iso(d?.startAt)).toBe("2026-05-01");
    expect(iso(d?.endAt)).toBe("2026-10-31");
  });

  it("moves a past single month to next year", () => {
    const d = deriveEventDates("Annual event held in June", today);
    expect(iso(d?.startAt)).toBe("2027-06-01");
    expect(iso(d?.endAt)).toBe("2027-06-30");
  });

  it("wraps ranges across the new year", () => {
    const d = deriveEventDates("Saturdays October through April", today);
    expect(iso(d?.startAt)).toBe("2026-10-01");
    expect(iso(d?.endAt)).toBe("2027-04-30");
  });

  it("uses day precision only for an explicit day", () => {
    const d = deriveEventDates("Annual July 1 event", today);
    expect(d?.precision).toBe("day");
    expect(iso(d?.startAt)).toBe("2027-07-01");
  });

  it("keeps the explicit day when other months are mentioned later", () => {
    const d = deriveEventDates("July 1st annually; some programming begins June 30th", today);
    expect(d?.precision).toBe("day");
    expect(iso(d?.startAt)).toBe("2027-07-01");
    expect(iso(d?.endAt)).toBe("2027-07-01");
  });

  it("treats 'July or August' as a range, not a guess", () => {
    const d = deriveEventDates("Summer event, typically July or August", today);
    expect(d?.precision).toBe("month");
    expect(iso(d?.startAt)).toBe("2027-07-01");
    expect(iso(d?.endAt)).toBe("2027-08-31");
  });

  it("refuses to invent dates from vague notes", () => {
    expect(deriveEventDates("Summer weekends, check the calendar", today)).toBeNull();
    expect(deriveEventDates("", today)).toBeNull();
  });
});

describe("labels and months", () => {
  it("always says usually for month precision", () => {
    const d = deriveEventDates("May through October", today);
    if (!d) throw new Error("fixture");
    expect(eventDateLabel(d.startAt, d.endAt, d.precision)).toBe("Usually May to October");
    const june = deriveEventDates("in June", today);
    if (!june) throw new Error("fixture");
    expect(eventDateLabel(june.startAt, june.endAt, june.precision)).toBe("Usually in June");
  });

  it("lists every month an event touches", () => {
    const d = deriveEventDates("November and December", today);
    if (!d) throw new Error("fixture");
    expect(monthsCovered(d.startAt, d.endAt).map(iso)).toEqual(["2026-11-01", "2026-12-01"]);
  });
});

describe("agenda", () => {
  // Thursday, November 5, 2026, 10am in Toronto.
  const now = new Date("2026-11-05T15:00:00Z");
  const at = (iso: string[], precision: "day" | "month" = "day") => ({
    startAt: new Date(iso[0] ?? "2026-11-05T00:00:00Z"),
    endAt: null,
    precision,
    occurrences: iso,
  });

  it("finds the coming weekend, and today when it is already Sunday", () => {
    expect(whenRange("weekend", now)).toEqual({ from: "2026-11-07", to: "2026-11-08" });
    expect(whenRange("weekend", new Date("2026-11-08T15:00:00Z"))).toEqual({
      from: "2026-11-08",
      to: "2026-11-08",
    });
  });

  it("groups by Toronto day, not UTC day", () => {
    // 8pm Friday in Toronto is already Saturday in UTC.
    const { days } = buildAgenda([at(["2026-11-07T01:00:00Z"])], "week", now);
    expect(days[0]?.key).toBe("2026-11-06");
    expect(days[0]?.label).toBe("Tomorrow");
  });

  it("drops showings that have finished", () => {
    const { days } = buildAgenda([at(["2026-11-05T11:00:00Z"])], "today", now);
    expect(days).toEqual([]);
  });

  it("treats midnight as no time given", () => {
    const { days } = buildAgenda([at(["2026-11-06T05:00:00Z"])], "tomorrow", now);
    expect(days[0]?.entries[0]?.timed).toBe(false);
  });

  it("keeps long runs out of the day lists", () => {
    const many = Array.from(
      { length: 8 },
      (_, i) => `2026-11-${String(5 + i).padStart(2, "0")}T18:00:00Z`,
    );
    const { days, running } = buildAgenda([at(many)], "week", now);
    expect(days).toEqual([]);
    expect(running).toHaveLength(1);
  });

  it("never promises a day for something known only by month", () => {
    const { days, seasonal } = buildAgenda(
      [{ ...at([], "month"), occurrences: null, startAt: new Date("2026-11-01T00:00:00Z") }],
      "today",
      now,
    );
    expect(days).toEqual([]);
    expect(seasonal).toHaveLength(1);
  });
});
