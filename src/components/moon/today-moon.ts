import { getMoonData } from "@/lib/astronomy/moon";
import { formatLocalDate, localDateToUtcNoon } from "@/lib/dates/local-date";
import type { LocalDate, MoonPhaseName } from "@/types/moon";

export const PHASE_DESCRIPTIONS: Readonly<Record<MoonPhaseName, string>> = {
  "New Moon": "Near the new Moon, little of the near side is sunlit. Illumination begins increasing after the new Moon.",
  "Waxing Crescent": "A slender crescent grows as more of the Moon's near side becomes illuminated.",
  "First Quarter": "Around half of the near side is illuminated, with the sunlit portion continuing to increase.",
  "Waxing Gibbous": "More than half of the near side is sunlit. Illumination increases toward the full Moon.",
  "Full Moon": "Near the full Moon, the near side is almost fully illuminated. Illumination begins decreasing after the full Moon.",
  "Waning Gibbous": "More than half of the near side remains sunlit, while illumination gradually decreases.",
  "Last Quarter": "Around half of the near side is illuminated, with the sunlit portion continuing to decrease.",
  "Waning Crescent": "A narrowing crescent remains as illumination decreases toward the new Moon.",
};

/** Presentation only: the public wrapper supplies unchanged astronomy data. */
export function createTodayMoonViewModel(date: LocalDate) {
  const moon = getMoonData(date);
  // The wrapper exposes UTC event dates, not event instants. This is a calendar
  // day estimate against those labels, never a live hours/minutes countdown.
  const daysUntilNextPhase = Math.max(0, Math.round(
    (localDateToUtcNoon(moon.nextMajorPhase.date).getTime() - localDateToUtcNoon(date).getTime()) / 86_400_000,
  ));
  const phaseDateOptions = { month: "short", day: "numeric", year: "numeric" } as const;

  return {
    date,
    moon,
    dateLabel: formatLocalDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    dateTime: `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`,
    description: PHASE_DESCRIPTIONS[moon.phaseName],
    illuminationLabel: `${Math.round(moon.illuminationPercentage)}%`,
    ageLabel: `${moon.moonAgeDays.toFixed(1)} days`,
    previousPhaseDateLabel: formatLocalDate(moon.previousMajorPhase.date, phaseDateOptions),
    nextPhaseDateLabel: formatLocalDate(moon.nextMajorPhase.date, phaseDateOptions),
    daysUntilNextPhase,
    countdownLabel: daysUntilNextPhase === 0 ? "Same calendar date" : `${daysUntilNextPhase} calendar ${daysUntilNextPhase === 1 ? "day" : "days"}`,
  };
}

export type TodayMoonViewModel = ReturnType<typeof createTodayMoonViewModel>;
