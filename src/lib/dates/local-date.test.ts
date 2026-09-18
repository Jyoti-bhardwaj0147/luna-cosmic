import { describe, expect, test } from "vitest";
import { getMoonData } from "@/lib/astronomy/moon";
import {
  addDays, addMonths, compareLocalDates, createLocalDate, dateToLocalDate,
  formatLocalDate, generateMonthDays, generateMonthGrid, getDaysInMonth,
  getNextMonth, getPreviousMonth, isSameLocalDate, isValidLocalDate,
  localDateToUtcNoon, utcInstantToLocalDate,
} from "@/lib/dates/local-date";

describe("LocalDate validation and conversion", () => {
  test("creates a valid leap day and converts at UTC noon", () => {
    const date = createLocalDate(2024, 2, 29);
    expect(date).toEqual({ year: 2024, month: 2, day: 29 });
    expect(isValidLocalDate(date)).toBe(true);
    expect(localDateToUtcNoon(date).toISOString()).toBe("2024-02-29T12:00:00.000Z");
  });

  test.each([
    [2023, 2, 29], [2024, 2, 30], [2024, 4, 31], [2024, 0, 1],
    [2024, 13, 1], [2024, 1, 0], [2024, 1, -1], [2024, 1, 32],
    [2024.5, 1, 1], [2024, 1.5, 1], [2024, 1, 1.5],
    [NaN, 1, 1], [2024, Infinity, 1], [2024, 1, -Infinity],
    [0, 1, 1], [1, 1, 1], [99, 12, 31], [1_000_000, 1, 1],
  ])("rejects unsupported or impossible date %s-%s-%s", (year, month, day) => {
    const date = { year, month, day };
    expect(isValidLocalDate(date)).toBe(false);
    expect(() => createLocalDate(year, month, day)).toThrow(RangeError);
    expect(() => localDateToUtcNoon(date)).toThrow(RangeError);
  });

  test("preserves the astronomy boundary's supported year convention", () => {
    expect(isValidLocalDate({ year: 100, month: 1, day: 1 })).toBe(true);
    expect(isValidLocalDate({ year: -1, month: 1, day: 1 })).toBe(true);
  });

  test("converts explicit instants without mutating them", () => {
    const instant = new Date("2024-02-29T23:45:00.000Z");
    const timestamp = instant.getTime();
    expect(utcInstantToLocalDate(instant)).toEqual({ year: 2024, month: 2, day: 29 });
    const local = new Date(2024, 1, 29, 23, 45);
    expect(dateToLocalDate(local)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(instant.getTime()).toBe(timestamp);
    expect(local.getHours()).toBe(23);
  });

  test("rejects invalid Date instances", () => {
    expect(() => utcInstantToLocalDate(new Date(NaN))).toThrow(RangeError);
    expect(() => dateToLocalDate(new Date(NaN))).toThrow(RangeError);
  });
});

describe("month lengths and navigation", () => {
  test.each([
    [2024, 1, 31], [2024, 4, 30], [2023, 2, 28], [2024, 2, 29],
    [1900, 2, 28], [2000, 2, 29], [2100, 2, 28],
  ])("counts days in %s-%s", (year, month, count) => {
    expect(getDaysInMonth({ year, month })).toBe(count);
  });

  test.each([{ year: 2024, month: 0 }, { year: 2024, month: 13 }, { year: NaN, month: 1 }])(
    "rejects invalid month %j throughout the API", (month) => {
      for (const utility of [getDaysInMonth, getPreviousMonth, getNextMonth, generateMonthGrid, generateMonthDays]) {
        expect(() => utility(month)).toThrow(RangeError);
      }
    },
  );

  test("navigates months and year boundaries", () => {
    expect(getPreviousMonth({ year: 2024, month: 5 })).toEqual({ year: 2024, month: 4 });
    expect(getNextMonth({ year: 2024, month: 5 })).toEqual({ year: 2024, month: 6 });
    expect(getPreviousMonth({ year: 2024, month: 1 })).toEqual({ year: 2023, month: 12 });
    expect(getNextMonth({ year: 2024, month: 12 })).toEqual({ year: 2025, month: 1 });
  });

  test("adds whole days across leap day and year boundaries", () => {
    expect(addDays({ year: 2024, month: 2, day: 28 }, 1)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(addDays({ year: 2024, month: 2, day: 29 }, 1)).toEqual({ year: 2024, month: 3, day: 1 });
    expect(addDays({ year: 2024, month: 1, day: 1 }, -1)).toEqual({ year: 2023, month: 12, day: 31 });
  });

  test("month arithmetic clamps the day and supports negative offsets", () => {
    expect(addMonths({ year: 2024, month: 1, day: 31 }, 1)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(addMonths({ year: 2023, month: 3, day: 31 }, -1)).toEqual({ year: 2023, month: 2, day: 28 });
    expect(addMonths({ year: 2024, month: 12, day: 31 }, 2)).toEqual({ year: 2025, month: 2, day: 28 });
  });

  test.each([NaN, Infinity, -Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid arithmetic offset %s", (offset) => {
      const date = { year: 2024, month: 1, day: 1 };
      expect(() => addDays(date, offset)).toThrow(RangeError);
      expect(() => addMonths(date, offset)).toThrow(RangeError);
    },
  );

  test("rejects invalid arithmetic inputs and unrepresentable results", () => {
    const invalid = { year: 2024, month: 2, day: 30 };
    expect(() => addDays(invalid, 1)).toThrow(RangeError);
    expect(() => addMonths(invalid, 1)).toThrow(RangeError);
    expect(() => addDays({ year: 2024, month: 1, day: 1 }, Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
    expect(() => addMonths({ year: 2024, month: 1, day: 1 }, Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
    expect(() => getPreviousMonth({ year: 100, month: 1 })).toThrow(RangeError);
  });
});

describe("Monday-first month grids", () => {
  test.each([
    [2024, 1, 35, "2024-01-01", "2024-02-04", 31],
    [2024, 4, 35, "2024-04-01", "2024-05-05", 30],
    [2023, 2, 35, "2023-01-30", "2023-03-05", 28],
    [2024, 2, 35, "2024-01-29", "2024-03-03", 29],
    [2021, 2, 35, "2021-02-01", "2021-03-07", 28],
    [2024, 9, 42, "2024-08-26", "2024-10-06", 30],
    [2024, 12, 42, "2024-11-25", "2025-01-05", 31],
    [2023, 1, 42, "2022-12-26", "2023-02-05", 31],
  ])("builds complete ordered weeks for %s-%s", (year, month, length, first, last, count) => {
    const input = Object.freeze({ year, month });
    const grid = generateMonthGrid(input);
    expect(grid).toHaveLength(length);
    const instants = grid.map(({ date }) => localDateToUtcNoon(date));
    expect(instants[0].toISOString().slice(0, 10)).toBe(first);
    expect(instants.at(-1)?.toISOString().slice(0, 10)).toBe(last);
    expect(instants[0].getUTCDay()).toBe(1);
    expect(instants.at(-1)?.getUTCDay()).toBe(0);
    expect(grid.every(({ date }) => isValidLocalDate(date))).toBe(true);
    for (let index = 1; index < instants.length; index++) {
      expect(instants[index].getTime() - instants[index - 1].getTime()).toBe(86_400_000);
      expect(compareLocalDates(grid[index].date, grid[index - 1].date)).toBeGreaterThan(0);
    }
    const members = grid.filter(({ isCurrentMonth }) => isCurrentMonth);
    expect(members.map(({ date }) => date.day)).toEqual(Array.from({ length: count }, (_, index) => index + 1));
    for (const cell of grid) {
      expect(cell.isCurrentMonth).toBe(cell.date.year === year && cell.date.month === month);
    }
    expect(generateMonthGrid(input)).toEqual(grid);
    expect(input).toEqual({ year, month });
  });

  test("marks leading and trailing dates outside the requested month", () => {
    const grid = generateMonthGrid({ year: 2024, month: 2 });
    expect(grid[0]).toEqual({ date: { year: 2024, month: 1, day: 29 }, isCurrentMonth: false });
    expect(grid[3]).toEqual({ date: { year: 2024, month: 2, day: 1 }, isCurrentMonth: true });
    expect(grid.at(-1)).toEqual({ date: { year: 2024, month: 3, day: 3 }, isCurrentMonth: false });
  });

  test("retains the deprecated Sunday-first six-week contract", () => {
    const grid = generateMonthDays({ year: 2024, month: 2 });
    expect(grid).toHaveLength(42);
    expect(grid[0].date).toEqual({ year: 2024, month: 1, day: 28 });
    expect(grid.at(-1)?.date).toEqual({ year: 2024, month: 3, day: 9 });
    expect(grid.filter(({ isCurrentMonth }) => isCurrentMonth)).toHaveLength(29);
  });

  test("produces a date accepted by the existing astronomy boundary", () => {
    const date = generateMonthGrid({ year: 2024, month: 2 })[3].date;
    const moon = getMoonData(date);
    expect(moon.phaseName).toBe("Last Quarter");
    expect(Number.isFinite(moon.illuminationPercentage)).toBe(true);
  });
});

describe("comparison, formatting and immutability", () => {
  const date = Object.freeze({ year: 2024, month: 2, day: 29 });

  test("compares explicit today and selected dates", () => {
    expect(isSameLocalDate(date, { ...date })).toBe(true);
    expect(isSameLocalDate({ year: 2023, month: 2, day: 29 }, { year: 2023, month: 2, day: 29 })).toBe(false);
    expect(isSameLocalDate(date, { year: 2024, month: 3, day: 1 })).toBe(false);
    expect(compareLocalDates(date, { ...date })).toBe(0);
    expect(compareLocalDates(date, { year: 2024, month: 3, day: 1 })).toBeLessThan(0);
    expect(compareLocalDates(date, { year: 2023, month: 12, day: 31 })).toBeGreaterThan(0);
  });

  test("formats explicit locale deterministically and retains existing defaults", () => {
    expect(formatLocalDate(date)).toBe("2/29/2024");
    expect(formatLocalDate(date, { year: "numeric", month: "long", day: "numeric" })).toBe("February 29, 2024");
    expect(formatLocalDate(date, { year: "numeric", month: "long", day: "numeric" }, "en-GB")).toBe("29 February 2024");
    expect(formatLocalDate(date, { timeZone: "Pacific/Kiritimati" })).toBe("2/29/2024");
    expect(() => formatLocalDate({ year: 2023, month: 2, day: 29 })).toThrow(RangeError);
  });

  test("never mutates dates, months, or formatting options", () => {
    const options = Object.freeze({ month: "long" as const, timeZone: "Pacific/Kiritimati" });
    expect(addDays(date, 0)).toEqual(date);
    expect(addDays(date, 0)).not.toBe(date);
    addMonths(date, 1);
    localDateToUtcNoon(date);
    formatLocalDate(date, options);
    getPreviousMonth(date);
    getNextMonth(date);
    expect(date).toEqual({ year: 2024, month: 2, day: 29 });
    expect(options).toEqual({ month: "long", timeZone: "Pacific/Kiritimati" });
  });
});
