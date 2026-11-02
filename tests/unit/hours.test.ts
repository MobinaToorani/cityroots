import { describe, expect, it } from "vitest";
import { openStatus, parseWeeklyHours } from "@/lib/domain/hours";

const EN = "–";

describe("parseWeeklyHours", () => {
  it("parses ranges of days with an en dash", () => {
    expect(parseWeeklyHours(`Mon${EN}Fri 9am${EN}5pm`)).toEqual({
      "1": [["09:00", "17:00"]],
      "2": [["09:00", "17:00"]],
      "3": [["09:00", "17:00"]],
      "4": [["09:00", "17:00"]],
      "5": [["09:00", "17:00"]],
    });
  });

  it("parses several segments and borrowed meridiems", () => {
    const w = parseWeeklyHours(`Mon${EN}Thu 9am${EN}9pm, Fri${EN}Sat 9am${EN}6pm, Sun 1${EN}5pm`);
    expect(w?.["4"]).toEqual([["09:00", "21:00"]]);
    expect(w?.["6"]).toEqual([["09:00", "18:00"]]);
    expect(w?.["7"]).toEqual([["13:00", "17:00"]]);
  });

  it("handles wrap-around day ranges and midnight", () => {
    const w = parseWeeklyHours(`Sun${EN}Thu 11am${EN}11pm, Fri${EN}Sat 11am${EN}midnight`);
    expect(Object.keys(w ?? {}).sort()).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
    expect(w?.["7"]).toEqual([["11:00", "23:00"]]);
    expect(w?.["5"]).toEqual([["11:00", "24:00"]]);
  });

  it("accepts closure notes and a year-round prefix", () => {
    expect(parseWeeklyHours(`Tue${EN}Sun 10am${EN}5pm; closed Mondays`)?.["1"]).toBeUndefined();
    expect(parseWeeklyHours(`Year-round: Saturday 7am${EN}2pm`)).toEqual({
      "6": [["07:00", "14:00"]],
    });
    expect(parseWeeklyHours("Weekends 10am-5pm")).toEqual({
      "6": [["10:00", "17:00"]],
      "7": [["10:00", "17:00"]],
    });
  });

  it.each([
    "Open year-round",
    "Dawn to dusk, year-round",
    `Saturdays 8am${EN}1pm, May through October`,
    `Wed${EN}Sun from 5pm`,
    `Tue${EN}Sat 10am${EN}5pm (Thu until 9pm); closed Sun${EN}Mon`,
    "Varies by program, check website",
    `Seasonal: check website for current hours`,
    `Wed${EN}Sun 10am${EN}5pm; seasonal hours, check website`,
  ])("refuses to guess for %s", (text) => {
    expect(parseWeeklyHours(text)).toBeNull();
  });
});

describe("openStatus", () => {
  const weekly = parseWeeklyHours(`Mon${EN}Fri 9am${EN}5pm, Sat 10am${EN}2pm`);
  if (!weekly) throw new Error("fixture did not parse");
  // 2026-10-28 is a Wednesday. Toronto is UTC-4 on that date.
  const at = (iso: string) => new Date(iso);

  it("is open during hours, with the closing time", () => {
    expect(openStatus(weekly, at("2026-10-28T14:00:00Z"))).toEqual({
      state: "open",
      closesAt: "5pm",
    });
  });

  it("is closed before opening and says when it opens", () => {
    expect(openStatus(weekly, at("2026-10-28T12:00:00Z"))).toEqual({
      state: "closed",
      opensAt: "9am",
      opensDay: 3,
    });
  });

  it("looks ahead to the next open day", () => {
    // Saturday 2026-10-31 at 3pm Toronto: next is Monday 9am.
    expect(openStatus(weekly, at("2026-10-31T19:00:00Z"))).toEqual({
      state: "closed",
      opensAt: "9am",
      opensDay: 1,
    });
  });

  it("counts hours that run past midnight", () => {
    const late = parseWeeklyHours(`Fri 6pm${EN}2am`);
    if (!late) throw new Error("fixture did not parse");
    // Saturday 2026-10-31 at 1am Toronto.
    expect(openStatus(late, at("2026-10-31T05:00:00Z"))).toEqual({
      state: "open",
      closesAt: "2am",
    });
  });
});
