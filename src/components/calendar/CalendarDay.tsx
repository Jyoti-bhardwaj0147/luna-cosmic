import type { LocalDate } from "@/types/moon";
import { getMoonData } from "@/lib/astronomy/moon";
import { formatLocalDate } from "@/lib/dates/local-date";

type CalendarDayProps = {
  date: LocalDate;
};

export function CalendarDay({ date }: CalendarDayProps) {
  const moon = getMoonData(date);

  return (
    <span aria-label={`${formatLocalDate(date, { month: "long", day: "numeric" })}: ${moon.phaseName}`}>
      {date.day}
    </span>
  );
}
