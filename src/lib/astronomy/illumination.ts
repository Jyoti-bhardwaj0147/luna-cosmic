import { Body, Illumination } from "astronomy-engine";
import type { LocalDate } from "@/types/moon";
import { localDateToUtcNoon } from "@/lib/dates/local-date";
import { assertValidLocalDate, getMoonPhaseFraction } from "@/lib/astronomy/phases";

export function getMoonIllumination(date: LocalDate): number {
  assertValidLocalDate(date);

  return Illumination(Body.Moon, localDateToUtcNoon(date)).phase_fraction * 100;
}

export function calculateMoonIlluminationPercentage(
  phaseFraction: number
): number {
  return ((1 - Math.cos(2 * Math.PI * phaseFraction)) / 2) * 100;
}

export function getApproximateMoonIllumination(date: LocalDate): number {
  return calculateMoonIlluminationPercentage(getMoonPhaseFraction(date));
}
