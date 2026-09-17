import { describe, expect, test } from "vitest";
import { addDays, generateMonthDays, isSameLocalDate } from "@/lib/dates/local-date";

describe("local date calendar utilities", () => {
  test("generates a stable six-week month grid", () => {
    const days = generateMonthDays({ year: 2024, month: 2 });

    expect(days).toHaveLength(42);
    expect(days.some((day) => day.date.day === 29 && day.isCurrentMonth)).toBe(true);
  });

  test("moves across month boundaries", () => {
    expect(addDays({ year: 2024, month: 1, day: 31 }, 1)).toEqual({
      year: 2024,
      month: 2,
      day: 1,
    });
  });

  test("compares local dates by civil fields", () => {
    expect(isSameLocalDate({ year: 2024, month: 2, day: 29 }, { year: 2024, month: 2, day: 29 })).toBe(true);
  });
});
