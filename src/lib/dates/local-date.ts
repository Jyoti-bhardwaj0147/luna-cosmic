import type { LocalDate } from "@/types/moon";

const MS_PER_DAY = 86_400_000;

/** Civil months use 1 (January) through 12 (December). */
export type CalendarMonth = Pick<LocalDate, "year" | "month">;

export type CalendarDay = {
  date: LocalDate;
  isCurrentMonth: boolean;
};

/** Matches astronomy: integer fields, representable UTC noon, excluding years 0-99. */
export function isValidLocalDate(date: LocalDate): boolean {
  const { year, month, day } = date;
  if (![year, month, day].every(Number.isInteger)) return false;

  const value = new Date(Date.UTC(year, month - 1, day, 12));
  return value.getUTCFullYear() === year &&
    value.getUTCMonth() === month - 1 && value.getUTCDate() === day;
}

export function createLocalDate(year: number, month: number, day: number): LocalDate {
  const date = { year, month, day };
  if (!isValidLocalDate(date)) {
    throw new RangeError("LocalDate must contain a supported, valid calendar date.");
  }
  return date;
}

/** Existing astronomy-compatible conversion; independent of the host timezone. */
export function localDateToUtcNoon(date: LocalDate): Date {
  const { year, month, day } = createLocalDate(date.year, date.month, date.day);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function utcInstantToLocalDate(date: Date): LocalDate {
  return createLocalDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** Explicit browser-local conversion for Today's Moon; not calendar arithmetic. */
export function dateToLocalDate(date: Date): LocalDate {
  return createLocalDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function assertIntegerOffset(offset: number): void {
  if (!Number.isSafeInteger(offset)) throw new RangeError("Date offsets must be safe integers.");
}

export function addDays(date: LocalDate, days: number): LocalDate {
  assertIntegerOffset(days);
  const utcNoon = localDateToUtcNoon(date).getTime();
  return utcInstantToLocalDate(new Date(utcNoon + days * MS_PER_DAY));
}

export function addMonths(date: LocalDate, months: number): LocalDate {
  localDateToUtcNoon(date);
  assertIntegerOffset(months);
  const target = utcInstantToLocalDate(new Date(Date.UTC(date.year, date.month - 1 + months, 1, 12)));
  return createLocalDate(target.year, target.month, Math.min(date.day, getDaysInMonth(target)));
}

export function compareLocalDates(a: LocalDate, b: LocalDate): number {
  return localDateToUtcNoon(a).getTime() - localDateToUtcNoon(b).getTime();
}

/** Accepts explicit today/selected dates without reading the system clock. */
export function isSameLocalDate(a: LocalDate, b: LocalDate): boolean {
  return isValidLocalDate(a) && isValidLocalDate(b) &&
    a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Preserves the options argument; locale defaults to en-US and UTC is enforced. */
export function formatLocalDate(
  date: LocalDate,
  options: Intl.DateTimeFormatOptions = {},
  locale = "en-US",
): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" })
    .format(localDateToUtcNoon(date));
}

export function getDaysInMonth(month: CalendarMonth): number {
  createLocalDate(month.year, month.month, 1);
  // UTC day zero is intentional here, after validating the requested month.
  return utcInstantToLocalDate(new Date(Date.UTC(month.year, month.month, 0, 12))).day;
}

function shiftMonth(month: CalendarMonth, offset: number): CalendarMonth {
  const result = addMonths(createLocalDate(month.year, month.month, 1), offset);
  return { year: result.year, month: result.month };
}

export function getPreviousMonth(month: CalendarMonth): CalendarMonth {
  return shiftMonth(month, -1);
}

export function getNextMonth(month: CalendarMonth): CalendarMonth {
  return shiftMonth(month, 1);
}

function buildMonthGrid(month: CalendarMonth, weekStartsOn: 0 | 1, fixedSixWeeks: boolean): CalendarDay[] {
  const first = createLocalDate(month.year, month.month, 1);
  const weekday = localDateToUtcNoon(first).getUTCDay();
  const leadingDays = (weekday - weekStartsOn + 7) % 7;
  const length = fixedSixWeeks ? 42 : Math.max(35, Math.ceil((leadingDays + getDaysInMonth(month)) / 7) * 7);
  const start = addDays(first, -leadingDays);

  return Array.from({ length }, (_, index) => {
    const date = addDays(start, index);
    return { date, isCurrentMonth: date.year === month.year && date.month === month.month };
  });
}

/** Monday-Sunday weeks: 35 or 42 cells, including at least 35 for short February. */
export function generateMonthGrid(month: CalendarMonth): CalendarDay[] {
  return buildMonthGrid(month, 1, false);
}

/** @deprecated Sunday-first, 42-cell compatibility contract for existing out-of-order UI. */
export function generateMonthDays(month: CalendarMonth): CalendarDay[] {
  return buildMonthGrid(month, 0, true);
}
