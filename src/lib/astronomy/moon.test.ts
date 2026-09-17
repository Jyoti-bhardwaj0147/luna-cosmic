import { describe, expect, test } from "vitest";
import type { LocalDate, MajorMoonPhaseName, MoonData } from "@/types/moon";
import { MAJOR_MOON_PHASES, MOON_PHASE_NAMES } from "@/constants/phases";
import {
  getMoonAge,
  getMoonData,
  getMoonIllumination,
  getMoonPhase,
  getNextMajorPhase,
  getPreviousMajorPhase,
} from "@/lib/astronomy/moon";
import {
  getMoonPhaseFraction,
  getMoonPhaseName,
  SYNODIC_MONTH_DAYS,
} from "@/lib/astronomy/phases";

const MARCH_2024_REFERENCE_DATES = {
  // NASA GSFC phases table, Universal Time:
  // https://eclipse.gsfc.nasa.gov/phase/phase2001gmt.html
  // New Moon 2024-03-10 09:00, First Quarter 2024-03-17 04:11,
  // Full Moon 2024-03-25 07:00, Last Quarter 2024-04-02 03:15.
  newMoon: { year: 2024, month: 3, day: 10 },
  firstQuarter: { year: 2024, month: 3, day: 17 },
  fullMoon: { year: 2024, month: 3, day: 25 },
  lastQuarter: { year: 2024, month: 4, day: 2 },
} satisfies Record<string, LocalDate>;

function toTime(date: LocalDate): number {
  return Date.UTC(date.year, date.month - 1, date.day, 12);
}

function expectFiniteNumber(value: number): void {
  expect(Number.isFinite(value)).toBe(true);
}

function expectValidLocalDate(date: LocalDate): void {
  expect(Number.isInteger(date.year)).toBe(true);
  expect(Number.isInteger(date.month)).toBe(true);
  expect(Number.isInteger(date.day)).toBe(true);
  expect(date.month).toBeGreaterThanOrEqual(1);
  expect(date.month).toBeLessThanOrEqual(12);
  expect(date.day).toBeGreaterThanOrEqual(1);
  expect(date.day).toBeLessThanOrEqual(31);

  const utcDate = new Date(toTime(date));
  expect(Number.isFinite(utcDate.getTime())).toBe(true);
  // UTC construction normalizes impossible dates, so verify every component.
  expect(utcDate.getUTCFullYear()).toBe(date.year);
  expect(utcDate.getUTCMonth() + 1).toBe(date.month);
  expect(utcDate.getUTCDate()).toBe(date.day);
}

function expectMajorPhaseName(name: MajorMoonPhaseName): void {
  expect(MAJOR_MOON_PHASES).toContain(name);
}

describe("expectValidLocalDate test helper", () => {
  test.each([
    ["a standard date", { year: 2024, month: 4, day: 15 }],
    ["a leap day", { year: 2024, month: 2, day: 29 }],
  ] as const)("accepts %s", (_, date) => {
    expect(() => expectValidLocalDate(date)).not.toThrow();
  });

  test.each([
    ["a non-leap-year February 29", { year: 2023, month: 2, day: 29 }],
    ["February 30", { year: 2024, month: 2, day: 30 }],
    ["April 31", { year: 2024, month: 4, day: 31 }],
    ["month 0", { year: 2024, month: 0, day: 15 }],
    ["month 13", { year: 2024, month: 13, day: 15 }],
    ["day 0", { year: 2024, month: 4, day: 0 }],
    ["day 32", { year: 2024, month: 4, day: 32 }],
    ["a fractional year", { year: 2024.5, month: 4, day: 15 }],
    ["a fractional month", { year: 2024, month: 4.5, day: 15 }],
    ["a fractional day", { year: 2024, month: 4, day: 15.5 }],
  ] as const)("rejects %s", (_, date) => {
    expect(() => expectValidLocalDate(date)).toThrow();
  });
});

describe("getMoonPhaseFraction", () => {
  test("returns a finite value within the documented cycle range", () => {
    const phaseFraction = getMoonPhaseFraction({ year: 2024, month: 4, day: 15 });

    expectFiniteNumber(phaseFraction);
    expect(phaseFraction).toBeGreaterThanOrEqual(0);
    expect(phaseFraction).toBeLessThan(1);
  });

  test("wraps around the phase cycle near a known New Moon", () => {
    const dayBeforeNewMoon = getMoonPhaseFraction({ year: 2024, month: 3, day: 9 });
    const newMoon = getMoonPhaseFraction(MARCH_2024_REFERENCE_DATES.newMoon);
    const dayAfterNewMoon = getMoonPhaseFraction({ year: 2024, month: 3, day: 11 });

    expect(dayBeforeNewMoon).toBeGreaterThan(0.9);
    expect(newMoon).toBeLessThan(0.08);
    expect(dayAfterNewMoon).toBeLessThan(0.1);
  });
});

describe("getMoonIllumination", () => {
  test("returns a finite percentage between 0 and 100", () => {
    const illumination = getMoonIllumination({ year: 2024, month: 4, day: 15 });

    expectFiniteNumber(illumination);
    expect(illumination).toBeGreaterThanOrEqual(0);
    expect(illumination).toBeLessThanOrEqual(100);
  });

  test("is near its minimum around a known New Moon", () => {
    const illumination = getMoonIllumination(MARCH_2024_REFERENCE_DATES.newMoon);

    // Civil dates are evaluated at UTC noon, about 3 hours after the reference instant.
    expect(illumination).toBeLessThan(2);
  });

  test("is near its maximum around a known Full Moon", () => {
    const illumination = getMoonIllumination(MARCH_2024_REFERENCE_DATES.fullMoon);

    // The full-moon reference instant is five hours before the UTC-noon sample.
    expect(illumination).toBeGreaterThan(98);
  });
});

describe("getMoonAge", () => {
  test("returns a finite value within the synodic-month range", () => {
    const age = getMoonAge({ year: 2024, month: 4, day: 15 });

    expectFiniteNumber(age);
    expect(age).toBeGreaterThanOrEqual(0);
    expect(age).toBeLessThan(SYNODIC_MONTH_DAYS);
  });

  test("is near zero around a known New Moon", () => {
    const age = getMoonAge(MARCH_2024_REFERENCE_DATES.newMoon);

    expect(age).toBeLessThan(1);
  });

  test("is near half a lunar cycle around a known Full Moon", () => {
    const age = getMoonAge(MARCH_2024_REFERENCE_DATES.fullMoon);

    // Phase calculations are sampled at UTC noon, not exactly at the full-moon instant.
    expect(age).toBeGreaterThan(SYNODIC_MONTH_DAYS / 2 - 1);
    expect(age).toBeLessThan(SYNODIC_MONTH_DAYS / 2 + 1);
  });
});

describe("getMoonPhase", () => {
  test.each([
    ["New Moon", MARCH_2024_REFERENCE_DATES.newMoon],
    ["Waxing Crescent", { year: 2024, month: 3, day: 13 }],
    ["First Quarter", MARCH_2024_REFERENCE_DATES.firstQuarter],
    ["Waxing Gibbous", { year: 2024, month: 3, day: 21 }],
    ["Full Moon", MARCH_2024_REFERENCE_DATES.fullMoon],
    ["Waning Gibbous", { year: 2024, month: 3, day: 29 }],
    ["Last Quarter", MARCH_2024_REFERENCE_DATES.lastQuarter],
    ["Waning Crescent", { year: 2024, month: 4, day: 6 }],
  ] as const)("classifies %s", (expectedPhaseName, date) => {
    expect(getMoonPhase(date)).toBe(expectedPhaseName);
  });

  test("handles adjacent phase-name boundaries consistently", () => {
    const justBeforeBoundary = 1 / 16 - Number.EPSILON;
    const atBoundary = 1 / 16;
    const laterBoundary = 5 / 16;

    expect(getMoonPhaseName(justBeforeBoundary)).toBe("New Moon");
    expect(getMoonPhaseName(atBoundary)).toBe("Waxing Crescent");
    expect(getMoonPhaseName(laterBoundary - Number.EPSILON)).toBe("First Quarter");
    expect(getMoonPhaseName(laterBoundary)).toBe("Waxing Gibbous");
  });
});

describe("surrounding major phases", () => {
  test("finds the previous major phase before the selected date", () => {
    const selectedDate = { year: 2024, month: 4, day: 20 };
    const previousPhase = getPreviousMajorPhase(selectedDate);

    expect(previousPhase.name).toBe("First Quarter");
    expectMajorPhaseName(previousPhase.name);
    expectValidLocalDate(previousPhase.date);
    expect(toTime(previousPhase.date)).toBeLessThan(toTime(selectedDate));
  });

  test("finds the next major phase after the selected date", () => {
    const selectedDate = { year: 2024, month: 4, day: 20 };
    const nextPhase = getNextMajorPhase(selectedDate);

    expect(nextPhase.name).toBe("Full Moon");
    expectMajorPhaseName(nextPhase.name);
    expectValidLocalDate(nextPhase.date);
    expect(toTime(nextPhase.date)).toBeGreaterThan(toTime(selectedDate));
  });

  test("handles a month boundary", () => {
    const selectedDate = { year: 2024, month: 1, day: 31 };
    const data = getMoonData(selectedDate);

    expect(toTime(data.previousMajorPhase.date)).toBeLessThan(toTime(selectedDate));
    expect(toTime(data.nextMajorPhase.date)).toBeGreaterThan(toTime(selectedDate));
    expect(data.nextMajorPhase.date.month).toBe(2);
  });

  test("handles a year boundary", () => {
    const selectedDate = { year: 2024, month: 12, day: 31 };
    const previousPhase = getPreviousMajorPhase(selectedDate);
    const nextPhase = getNextMajorPhase(selectedDate);

    expectMajorPhaseName(previousPhase.name);
    expectMajorPhaseName(nextPhase.name);
    expect(toTime(previousPhase.date)).toBeLessThan(toTime(selectedDate));
    expect(toTime(nextPhase.date)).toBeGreaterThan(toTime(selectedDate));
    expect(nextPhase.date.year).toBe(2025);
  });
});

describe("getMoonData", () => {
  test("returns the approved MoonData shape", () => {
    const data = getMoonData({ year: 2024, month: 4, day: 15 });
    const typedData: MoonData = data;

    expect(MOON_PHASE_NAMES).toContain(typedData.phaseName);
    expectFiniteNumber(typedData.phaseFraction);
    expectFiniteNumber(typedData.illuminationPercentage);
    expectFiniteNumber(typedData.moonAgeDays);
    expectMajorPhaseName(typedData.previousMajorPhase.name);
    expectMajorPhaseName(typedData.nextMajorPhase.name);
    expectValidLocalDate(typedData.previousMajorPhase.date);
    expectValidLocalDate(typedData.nextMajorPhase.date);
  });

  test("agrees with the individual calculation functions", () => {
    const date = { year: 2024, month: 4, day: 15 };
    const data = getMoonData(date);

    expect(data.phaseName).toBe(getMoonPhase(date));
    expect(data.phaseFraction).toBeCloseTo(getMoonPhaseFraction(date), 12);
    expect(data.illuminationPercentage).toBeCloseTo(getMoonIllumination(date), 12);
    expect(data.moonAgeDays).toBeCloseTo(getMoonAge(date), 12);
    expect(data.previousMajorPhase).toEqual(getPreviousMajorPhase(date));
    expect(data.nextMajorPhase).toEqual(getNextMajorPhase(date));
  });

  test("does not mutate the input date", () => {
    const date = { year: 2024, month: 4, day: 15 };

    getMoonData(date);

    expect(date).toEqual({ year: 2024, month: 4, day: 15 });
  });

  test("is deterministic for repeated calls with the same input", () => {
    const date = { year: 2024, month: 4, day: 15 };

    expect(getMoonData(date)).toEqual(getMoonData(date));
  });
});

describe("date-related and invalid input cases", () => {
  test("handles a leap-year date", () => {
    const data = getMoonData({ year: 2024, month: 2, day: 29 });

    expect(data.phaseName).toBe("Waning Gibbous");
    expect(data.illuminationPercentage).toBeGreaterThanOrEqual(0);
    expect(data.illuminationPercentage).toBeLessThanOrEqual(100);
  });

  test("handles an end-of-month transition", () => {
    const data = getMoonData({ year: 2024, month: 4, day: 30 });

    expect(data.phaseName).toBe("Last Quarter");
    expect(data.nextMajorPhase.date.month).toBe(5);
  });

  test("handles an end-of-year transition", () => {
    const data = getMoonData({ year: 2024, month: 12, day: 31 });

    expect(data.previousMajorPhase.date.year).toBe(2024);
    expect(data.nextMajorPhase.date.year).toBe(2025);
  });

  test("throws a RangeError for invalid LocalDate values", () => {
    expect(() => getMoonData({ year: 2024, month: 2, day: 30 })).toThrow(
      RangeError
    );
  });
});
