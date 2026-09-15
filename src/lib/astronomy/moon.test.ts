import { describe, expect, test } from "vitest";
import type { LocalDate } from "@/types/moon";
import {
  getMoonAge,
  getMoonData,
  getMoonIllumination,
  getMoonPhase,
  getNextMajorPhase,
  getPreviousMajorPhase,
} from "@/lib/astronomy/moon";

function toTime(date: LocalDate): number {
  return Date.UTC(date.year, date.month - 1, date.day, 12);
}

describe("moon calculation layer", () => {
  test("calculates a known New Moon date", () => {
    expect(getMoonPhase({ year: 2024, month: 3, day: 10 })).toBe("New Moon");
  });

  test("calculates a known Full Moon date", () => {
    expect(getMoonPhase({ year: 2024, month: 4, day: 23 })).toBe("Full Moon");
  });

  test("keeps illumination between 0 and 100", () => {
    const illumination = getMoonIllumination({ year: 2024, month: 4, day: 15 });

    expect(illumination).toBeGreaterThanOrEqual(0);
    expect(illumination).toBeLessThanOrEqual(100);
  });

  test("keeps Moon age within a valid lunar-cycle range", () => {
    const age = getMoonAge({ year: 2024, month: 4, day: 15 });

    expect(age).toBeGreaterThanOrEqual(0);
    expect(age).toBeLessThan(29.530588853);
  });

  test("finds the previous major phase before the selected date", () => {
    const selectedDate = { year: 2024, month: 4, day: 20 };
    const previousPhase = getPreviousMajorPhase(selectedDate);

    expect(previousPhase.name).toBe("First Quarter");
    expect(toTime(previousPhase.date)).toBeLessThan(toTime(selectedDate));
  });

  test("finds the next major phase after the selected date", () => {
    const selectedDate = { year: 2024, month: 4, day: 20 };
    const nextPhase = getNextMajorPhase(selectedDate);

    expect(nextPhase.name).toBe("Full Moon");
    expect(toTime(nextPhase.date)).toBeGreaterThan(toTime(selectedDate));
  });

  test("handles a leap-year date", () => {
    const data = getMoonData({ year: 2024, month: 2, day: 29 });

    expect(data.phaseName).toBe("Waning Gibbous");
    expect(data.illuminationPercentage).toBeGreaterThanOrEqual(0);
    expect(data.illuminationPercentage).toBeLessThanOrEqual(100);
  });

  test("handles a month boundary", () => {
    const selectedDate = { year: 2024, month: 1, day: 31 };
    const data = getMoonData(selectedDate);

    expect(data.illuminationPercentage).toBeGreaterThanOrEqual(0);
    expect(data.illuminationPercentage).toBeLessThanOrEqual(100);
    expect(toTime(data.previousMajorPhase.date)).toBeLessThan(toTime(selectedDate));
    expect(toTime(data.nextMajorPhase.date)).toBeGreaterThan(toTime(selectedDate));
    expect(data.nextMajorPhase.date.month).toBe(2);
  });

  test("throws a RangeError for invalid dates", () => {
    expect(() => getMoonData({ year: 2024, month: 2, day: 30 })).toThrow(
      RangeError
    );
  });
});
