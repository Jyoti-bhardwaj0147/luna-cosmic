import { MoonPhase, NextMoonQuarter, SearchMoonQuarter } from "astronomy-engine";
import type { LocalDate, MoonMajorPhase, MoonPhaseName } from "@/types/moon";
import { localDateToUtcNoon, utcInstantToLocalDate } from "@/lib/dates/local-date";
import { MOON_QUARTER_PHASE_NAMES } from "@/constants/phases";

export const SYNODIC_MONTH_DAYS = 29.530588853;

const FULL_CYCLE_DEGREES = 360;
const MS_PER_DAY = 86_400_000;
const QUARTER_SEARCH_WINDOW_DAYS = 40;

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function assertValidLocalDate(date: LocalDate): void {
  const { year, month, day } = date;

  if (![year, month, day].every(Number.isInteger)) {
    throw new RangeError("LocalDate values must be integers.");
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day, 12));
  const isValid =
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day;

  if (!isValid) {
    throw new RangeError("LocalDate must contain a valid calendar date.");
  }
}

function dateToCalculationInstant(date: LocalDate): Date {
  assertValidLocalDate(date);

  return localDateToUtcNoon(date);
}

export function getMoonPhase(date: LocalDate): MoonPhaseName {
  return getMoonPhaseName(getMoonPhaseFraction(date));
}

export function getMoonAge(date: LocalDate): number {
  return getMoonPhaseFraction(date) * SYNODIC_MONTH_DAYS;
}

export function getMoonPhaseFraction(date: LocalDate): number {
  const phaseDegrees = MoonPhase(dateToCalculationInstant(date));

  return positiveModulo(phaseDegrees, FULL_CYCLE_DEGREES) / FULL_CYCLE_DEGREES;
}

export function getPreviousMajorPhase(date: LocalDate): MoonMajorPhase {
  const selectedDate = dateToCalculationInstant(date);
  const searchStart = new Date(
    selectedDate.getTime() - QUARTER_SEARCH_WINDOW_DAYS * MS_PER_DAY
  );
  let previousQuarter = SearchMoonQuarter(searchStart);
  let nextQuarter = NextMoonQuarter(previousQuarter);

  while (nextQuarter.time.date.getTime() < selectedDate.getTime()) {
    previousQuarter = nextQuarter;
    nextQuarter = NextMoonQuarter(nextQuarter);
  }

  return moonMajorPhaseFromQuarter(previousQuarter.quarter, previousQuarter.time.date);
}

export function getNextMajorPhase(date: LocalDate): MoonMajorPhase {
  const selectedDate = dateToCalculationInstant(date);
  const nextQuarter = SearchMoonQuarter(selectedDate);

  return moonMajorPhaseFromQuarter(nextQuarter.quarter, nextQuarter.time.date);
}

export function getMoonPhaseName(phaseFraction: number): MoonPhaseName {
  const normalizedFraction = positiveModulo(phaseFraction, 1);

  if (normalizedFraction < 1 / 16 || normalizedFraction >= 15 / 16) {
    return "New Moon";
  }

  if (normalizedFraction < 3 / 16) {
    return "Waxing Crescent";
  }

  if (normalizedFraction < 5 / 16) {
    return "First Quarter";
  }

  if (normalizedFraction < 7 / 16) {
    return "Waxing Gibbous";
  }

  if (normalizedFraction < 9 / 16) {
    return "Full Moon";
  }

  if (normalizedFraction < 11 / 16) {
    return "Waning Gibbous";
  }

  if (normalizedFraction < 13 / 16) {
    return "Last Quarter";
  }

  return "Waning Crescent";
}

export function getSurroundingMajorPhases(date: LocalDate): {
  previousMajorPhase: MoonMajorPhase;
  nextMajorPhase: MoonMajorPhase;
} {
  return {
    previousMajorPhase: getPreviousMajorPhase(date),
    nextMajorPhase: getNextMajorPhase(date),
  };
}

export const calculateMoonPhaseFraction = getMoonPhaseFraction;
export const calculateMoonAgeDays = getMoonAge;

function moonMajorPhaseFromQuarter(quarter: number, date: Date): MoonMajorPhase {
  const name = MOON_QUARTER_PHASE_NAMES[quarter];

  if (!name) {
    throw new RangeError(`Unsupported moon quarter: ${quarter}`);
  }

  return {
    name,
    date: utcInstantToLocalDate(date),
  };
}
