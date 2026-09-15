import type { LocalDate, MoonData, MoonDetails } from "@/types/moon";
import { getMoonIllumination } from "@/lib/astronomy/illumination";
import {
  getMoonAge,
  getMoonPhase,
  getMoonPhaseFraction,
  getNextMajorPhase,
  getPreviousMajorPhase,
} from "@/lib/astronomy/phases";

export function getMoonData(date: LocalDate): MoonData {
  return {
    phaseName: getMoonPhase(date),
    phaseFraction: getMoonPhaseFraction(date),
    illuminationPercentage: getMoonIllumination(date),
    moonAgeDays: getMoonAge(date),
    previousMajorPhase: getPreviousMajorPhase(date),
    nextMajorPhase: getNextMajorPhase(date),
  };
}

export const calculateMoonDetails: (date: LocalDate) => MoonDetails = getMoonData;

export {
  getMoonAge,
  getMoonIllumination,
  getMoonPhase,
  getNextMajorPhase,
  getPreviousMajorPhase,
};
