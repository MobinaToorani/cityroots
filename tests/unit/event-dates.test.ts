import { describe, expect, it } from "vitest";
import { deriveEventDates, eventDateLabel, monthsCovered } from "@/lib/domain/event-dates";

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
