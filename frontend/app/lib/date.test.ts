import { describe, expect, test } from "vite-plus/test";
import { diffCalendarDays, formatDateOnly, parseDateOnly, startOfToday } from "./date";

describe("parseDateOnly", () => {
  test("parses a date-only string into local midnight", () => {
    const date = parseDateOnly("2027-06-01");
    expect(date.getFullYear()).toBe(2027);
    expect(date.getMonth()).toBe(5);
    expect(date.getDate()).toBe(1);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
  });

  test("copies a Date without mutating the original", () => {
    const original = new Date(2027, 5, 1, 15, 30);
    const parsed = parseDateOnly(original);
    expect(parsed.getHours()).toBe(0);
    expect(original.getHours()).toBe(15);
  });
});

describe("formatDateOnly", () => {
  test("formats the local calendar date", () => {
    expect(formatDateOnly(new Date(2027, 0, 5))).toBe("2027-01-05");
  });

  test("round-trips with parseDateOnly", () => {
    expect(formatDateOnly(parseDateOnly("2027-12-31"))).toBe("2027-12-31");
  });
});

describe("diffCalendarDays", () => {
  test.each([
    ["2027-06-02", "2027-06-01", 1],
    ["2027-06-01", "2027-06-01", 0],
    ["2027-05-30", "2027-06-01", -2],
    ["2028-06-01", "2027-06-01", 366], // 2028 is a leap year
  ])("from %s to %s is %i days", (to, from, expected) => {
    expect(diffCalendarDays(to, from)).toBe(expected);
  });

  test("defaults to counting from today", () => {
    expect(diffCalendarDays(startOfToday())).toBe(0);
  });
});
