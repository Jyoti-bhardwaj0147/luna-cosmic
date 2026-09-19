"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CalendarDay } from "@/components/calendar/CalendarDay";
import { SelectedDateDetails } from "@/components/calendar/SelectedDateDetails";
import { GlassCard } from "@/components/ui/GlassCard";
import { IconButton } from "@/components/ui/IconButton";
import { getMoonData } from "@/lib/astronomy/moon";
import {
  addDays,
  addMonths,
  createLocalDate,
  dateToLocalDate,
  formatLocalDate,
  generateMonthGrid,
  getNextMonth,
  getPreviousMonth,
  isSameLocalDate,
  type CalendarMonth,
} from "@/lib/dates/local-date";
import type { LocalDate } from "@/types/moon";

type LunarCalendarProps = {
  initialDate?: LocalDate;
};

const weekdays = [
  { short: "Mon", long: "Monday" },
  { short: "Tue", long: "Tuesday" },
  { short: "Wed", long: "Wednesday" },
  { short: "Thu", long: "Thursday" },
  { short: "Fri", long: "Friday" },
  { short: "Sat", long: "Saturday" },
  { short: "Sun", long: "Sunday" },
] as const;

const subscribe = () => () => {};
const getServerSnapshot = () => null;
const getLocalDaySnapshot = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

function dateKey(date: LocalDate): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function sameMonth(date: LocalDate, month: CalendarMonth): boolean {
  return date.year === month.year && date.month === month.month;
}

function copyDate(date: LocalDate): LocalDate {
  return createLocalDate(date.year, date.month, date.day);
}

type CalendarControllerProps = {
  headingId: string;
  initialDate: LocalDate;
  today: LocalDate;
};

function CalendarController({ headingId, initialDate, today }: CalendarControllerProps) {
  const [currentMonth, setCurrentMonth] = useState<CalendarMonth>(() => ({
    year: initialDate.year,
    month: initialDate.month,
  }));
  const [selectedDate, setSelectedDate] = useState<LocalDate>(() => copyDate(initialDate));
  const [focusedDate, setFocusedDate] = useState<LocalDate>(() => copyDate(initialDate));
  const pendingFocusKey = useRef<string | null>(null);
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());

  const calendarDays = useMemo(
    () => generateMonthGrid(currentMonth).map((day, index) => ({
      ...day,
      columnIndex: index % 7,
      key: dateKey(day.date),
      moon: getMoonData(day.date),
    })),
    [currentMonth],
  );
  const monthLabel = formatLocalDate(
    { year: currentMonth.year, month: currentMonth.month, day: 1 },
    { month: "long", year: "numeric" },
  );
  const focusedKey = dateKey(focusedDate);
  const rovingKey = calendarDays.some((day) => day.key === focusedKey)
    ? focusedKey
    : calendarDays.find((day) => day.isCurrentMonth)?.key ?? calendarDays[0].key;
  const selectedKey = dateKey(selectedDate);
  const selectedMoon = useMemo(
    () => calendarDays.find((day) => day.key === selectedKey)?.moon ?? getMoonData(selectedDate),
    [calendarDays, selectedDate, selectedKey],
  );

  useEffect(() => {
    const key = pendingFocusKey.current;
    if (!key) return;

    const button = dayRefs.current.get(key);
    if (button) {
      pendingFocusKey.current = null;
      button.focus();
    }
  }, [calendarDays]);

  function focusDate(date: LocalDate) {
    const target = copyDate(date);
    if (sameMonth(target, currentMonth)) {
      dayRefs.current.get(dateKey(target))?.focus();
      return;
    }

    pendingFocusKey.current = dateKey(target);
    setFocusedDate(target);
    setCurrentMonth({ year: target.year, month: target.month });
  }

  function activateDate(date: LocalDate) {
    const target = copyDate(date);
    const changesMonth = !sameMonth(target, currentMonth);
    setSelectedDate(target);
    setFocusedDate(target);

    if (changesMonth) {
      pendingFocusKey.current = dateKey(target);
      setCurrentMonth({ year: target.year, month: target.month });
    }
  }

  function moveDisplayedMonth(direction: -1 | 1) {
    const nextMonth = direction === -1
      ? getPreviousMonth(currentMonth)
      : getNextMonth(currentMonth);
    pendingFocusKey.current = null;
    setCurrentMonth(nextMonth);
    setFocusedDate((date) => addMonths(date, direction));
  }

  function handleDayKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    date: LocalDate,
    columnIndex: number,
  ) {
    let target: LocalDate | null = null;

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        activateDate(date);
        return;
      case "ArrowLeft":
        target = addDays(date, -1);
        break;
      case "ArrowRight":
        target = addDays(date, 1);
        break;
      case "ArrowUp":
        target = addDays(date, -7);
        break;
      case "ArrowDown":
        target = addDays(date, 7);
        break;
      case "Home":
        target = addDays(date, -columnIndex);
        break;
      case "End":
        target = addDays(date, 6 - columnIndex);
        break;
      case "PageUp":
        target = addMonths(date, -1);
        break;
      case "PageDown":
        target = addMonths(date, 1);
        break;
      default:
        return;
    }

    event.preventDefault();
    focusDate(target);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-stretch">
      <GlassCard as="div" className="min-w-0 overflow-hidden p-2.5 sm:p-5">
        <header className="mb-3 flex items-center justify-between gap-2 px-1 sm:mb-5">
          <IconButton
            className="focus-visible:border-accent-blue focus-visible:outline-[3px]! focus-visible:outline-solid! focus-visible:outline-accent-blue! focus-visible:outline-offset-2!"
            icon={<ChevronLeft size={18} strokeWidth={1.8} />}
            label="Show previous month"
            onClick={() => moveDisplayedMonth(-1)}
          />
          <h2 className="min-w-0 text-center font-display text-xl font-semibold leading-tight text-text-primary sm:text-2xl" id={headingId}>
            {monthLabel}
          </h2>
          <IconButton
            className="focus-visible:border-accent-blue focus-visible:outline-[3px]! focus-visible:outline-solid! focus-visible:outline-accent-blue! focus-visible:outline-offset-2!"
            icon={<ChevronRight size={18} strokeWidth={1.8} />}
            label="Show next month"
            onClick={() => moveDisplayedMonth(1)}
          />
        </header>

        <table className="w-full table-fixed border-separate border-spacing-0" aria-describedby={`${headingId}-instructions`}>
          <caption className="sr-only">
            {monthLabel} lunar calendar, Monday through Sunday.
          </caption>
          <thead>
            <tr>
              {weekdays.map((weekday) => (
                <th className="pb-1.5 text-center text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-secondary sm:pb-2 sm:text-xs" key={weekday.long} scope="col">
                  <span aria-hidden="true">{weekday.short}</span>
                  <span className="sr-only">{weekday.long}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: calendarDays.length / 7 }, (_, weekIndex) => {
              const week = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7);
              return (
                <tr key={`${week[0].key}-${week[6].key}`}>
                  {week.map((day) => (
                    <CalendarDay
                      buttonRef={(node) => {
                        if (node) dayRefs.current.set(day.key, node);
                        else dayRefs.current.delete(day.key);
                      }}
                      date={day.date}
                      isCurrentMonth={day.isCurrentMonth}
                      isSelected={day.key === selectedKey}
                      isToday={isSameLocalDate(day.date, today)}
                      key={day.key}
                      moon={day.moon}
                      onActivate={activateDate}
                      onFocusDate={(date) => {
                        if (!isSameLocalDate(date, focusedDate)) setFocusedDate(copyDate(date));
                      }}
                      onKeyDown={(event, date) => handleDayKeyDown(event, date, day.columnIndex)}
                      tabIndex={day.key === rovingKey ? 0 : -1}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="sr-only" id={`${headingId}-instructions`}>
          Use the arrow keys to move by day or week, Home and End to move within a week, and Page Up and Page Down to move by month. Press Enter or Space to select a date.
        </p>
      </GlassCard>

      <SelectedDateDetails date={selectedDate} moon={selectedMoon} />
    </div>
  );
}

export function LunarCalendar({ initialDate }: LunarCalendarProps) {
  const headingId = useId();
  const localDay = useSyncExternalStore(subscribe, getLocalDaySnapshot, getServerSnapshot);
  const suppliedDate = initialDate ? copyDate(initialDate) : null;
  const resolvedDate = suppliedDate
    ?? (localDay === null ? null : dateToLocalDate(new Date(localDay)));

  return (
    <section aria-labelledby={headingId}>
      {resolvedDate ? (
        <CalendarController
          headingId={headingId}
          initialDate={resolvedDate}
          key={dateKey(resolvedDate)}
          today={resolvedDate}
        />
      ) : (
        <GlassCard as="div" className="flex min-h-80 items-center justify-center p-6 text-center">
          <h2 className="sr-only" id={headingId}>Lunar calendar</h2>
          <p className="text-sm text-text-secondary" role="status">Preparing your local lunar calendar…</p>
        </GlassCard>
      )}
    </section>
  );
}
