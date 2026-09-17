import type { LocalDate } from "@/types/moon";

const MS_PER_DAY = 86_400_000;

export function localDateToUtcNoon(date: LocalDate): Date {
  return new Date(Date.UTC(date.year, date.month - 1, date.day, 12));
}

export function utcInstantToLocalDate(date: Date): LocalDate {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function dateToLocalDate(date: Date): LocalDate {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const utcNoon = localDateToUtcNoon(date).getTime();

  return utcInstantToLocalDate(new Date(utcNoon + days * MS_PER_DAY));
}

export function addMonths(date: LocalDate, months: number): LocalDate {
  const target = new Date(Date.UTC(date.year, date.month - 1 + months, 1, 12));
  const daysInTargetMonth = getDaysInMonth({
    year: target.getUTCFullYear(),
    month: target.getUTCMonth() + 1,
  });

  return {
    year: target.getUTCFullYear(),
    month: target.getUTCMonth() + 1,
    day: Math.min(date.day, daysInTargetMonth),
  };
}

export function compareLocalDates(a: LocalDate, b: LocalDate): number {
  return localDateToUtcNoon(a).getTime() - localDateToUtcNoon(b).getTime();
}

export function isSameLocalDate(a: LocalDate, b: LocalDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function formatLocalDate(date: LocalDate, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    ...options,
  }).format(localDateToUtcNoon(date));
}

export function getDaysInMonth(date: Pick<LocalDate, "year" | "month">): number {
  return new Date(Date.UTC(date.year, date.month, 0, 12)).getUTCDate();
}

export type CalendarDay = {
  date: LocalDate;
  isCurrentMonth: boolean;
};

export function generateMonthDays(monthDate: Pick<LocalDate, "year" | "month">): CalendarDay[] {
  const firstOfMonth = new Date(Date.UTC(monthDate.year, monthDate.month - 1, 1, 12));
  const leadingDays = firstOfMonth.getUTCDay();
  const startDate = addDays(
    { year: monthDate.year, month: monthDate.month, day: 1 },
    -leadingDays
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(startDate, index);

    return {
      date,
      isCurrentMonth: date.year === monthDate.year && date.month === monthDate.month,
    };
  });
}