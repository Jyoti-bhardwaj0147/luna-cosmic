export type LocalDate = {
  year: number;
  month: number;
  day: number;
};

export type MajorMoonPhaseName =
  | "New Moon"
  | "First Quarter"
  | "Full Moon"
  | "Last Quarter";

export type MoonPhaseName =
  | MajorMoonPhaseName
  | "Waxing Crescent"
  | "Waxing Gibbous"
  | "Waning Gibbous"
  | "Waning Crescent";

export type MoonMajorPhase = {
  name: MajorMoonPhaseName;
  date: LocalDate;
};

export type MoonDetails = {
  phaseName: MoonPhaseName;
  phaseFraction: number;
  illuminationPercentage: number;
  moonAgeDays: number;
  previousMajorPhase: MoonMajorPhase;
  nextMajorPhase: MoonMajorPhase;
};

export type MoonData = MoonDetails;
