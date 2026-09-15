import type { MajorMoonPhaseName, MoonPhaseName } from "@/types/moon";

export const MAJOR_MOON_PHASES: MajorMoonPhaseName[] = [
  "New Moon",
  "First Quarter",
  "Full Moon",
  "Last Quarter",
];

export const MOON_PHASE_NAMES: MoonPhaseName[] = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
];

export const MOON_QUARTER_PHASE_NAMES: Record<number, MajorMoonPhaseName> = {
  0: "New Moon",
  1: "First Quarter",
  2: "Full Moon",
  3: "Last Quarter",
};
