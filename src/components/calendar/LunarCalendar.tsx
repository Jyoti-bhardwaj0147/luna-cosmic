"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LocalDate, MoonData } from "@/types/moon";
import { getMoonData } from "@/lib/astronomy/moon";
import {
  addDays,
  addMonths,
  dateToLocalDate,
  formatLocalDate,
  generateMonthDays,
  isSameLocalDate,
} from "@/lib/dates/local-date";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { MoonSummary } from "@/components/moon/MoonDetails";

type LunarCalendarProps = {
  initialDate?: LocalDate;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: LocalDate): string {
  return `${date.year}-${date.month}-${date.day}`;
}

function dayOfWeek(date: LocalDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day, 12)).getUTCDay();
}

export function LunarCalendar({ initialDate }: LunarCalendarProps) {
  const today = useMemo(() => initialDate ?? dateToLocalDate(new Date()), [initialDate]);
  const [visibleMonth, setVisibleMonth] = useState<LocalDate>({
    year: today.year,
    month: today.month,
    day: 1,
  });
  const [selectedDate, setSelectedDate] = useState<LocalDate>(today);
  const shouldFocusSelectedDate = useRef(false);
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const days = useMemo(() => generateMonthDays(visibleMonth), [visibleMonth]);
  const selectedMoon = useMemo<MoonData>(() => getMoonData(selectedDate), [selectedDate]);

  useEffect(() => {
    if (!shouldFocusSelectedDate.current) {
      return;
    }

    dayRefs.current.get(dateKey(selectedDate))?.focus();
    shouldFocusSelectedDate.current = false;
  }, [selectedDate, days]);

  function moveMonth(months: number) {
    const nextMonth = addMonths(visibleMonth, months);
    setVisibleMonth({ year: nextMonth.year, month: nextMonth.month, day: 1 });
  }

  function selectDate(date: LocalDate, shouldFocus = false) {
    setSelectedDate(date);
    setVisibleMonth({ year: date.year, month: date.month, day: 1 });
    shouldFocusSelectedDate.current = shouldFocus;
  }

  function handleDayKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: LocalDate) {
    const keyOffset: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -dayOfWeek(date),
      End: 6 - dayOfWeek(date),
    };
    const offset = keyOffset[event.key];

    if (offset === undefined) {
      return;
    }

    event.preventDefault();
    selectDate(addDays(date, offset), true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <GlassCard className="p-4 sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Button aria-label="Previous month" onClick={() => moveMonth(-1)} type="button" variant="secondary">
            <ChevronLeft aria-hidden="true" size={18} />
          </Button>
          <h1 className="text-center text-xl font-semibold text-foreground sm:text-2xl">
            {formatLocalDate(visibleMonth, { month: "long", year: "numeric" })}
          </h1>
          <Button aria-label="Next month" onClick={() => moveMonth(1)} type="button" variant="secondary">
            <ChevronRight aria-hidden="true" size={18} />
          </Button>
        </div>

        <div aria-label="Lunar calendar" className="grid gap-1" role="grid">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-muted" role="row">
            {weekdays.map((weekday) => (
              <div key={weekday} className="py-2" role="columnheader">
                {weekday}
              </div>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, weekIndex) => (
            <div className="grid grid-cols-7 gap-1" key={weekIndex} role="row">
              {days.slice(weekIndex * 7, weekIndex * 7 + 7).map(({ date, isCurrentMonth }) => {
                const moon = getMoonData(date);
                const selected = isSameLocalDate(date, selectedDate);

                return (
                  <button
                    aria-label={`${formatLocalDate(date, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}, ${moon.phaseName}`}
                    aria-selected={selected}
                    className={`min-h-20 rounded-lg border p-2 text-left transition-colors sm:min-h-24 ${
                      selected
                        ? "border-cyan bg-cyan/15 text-foreground"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                    } ${isCurrentMonth ? "text-foreground" : "text-muted/55"}`}
                    key={dateKey(date)}
                    onClick={() => selectDate(date)}
                    onKeyDown={(event) => handleDayKeyDown(event, date)}
                    ref={(node) => {
                      if (node) {
                        dayRefs.current.set(dateKey(date), node);
                      } else {
                        dayRefs.current.delete(dateKey(date));
                      }
                    }}
                    role="gridcell"
                    tabIndex={selected ? 0 : -1}
                    type="button"
                  >
                    <span className="block text-sm font-semibold">{date.day}</span>
                    <span className="mt-2 block h-6 w-6 rounded-full moon-mask" aria-hidden="true" />
                    <span className="sr-only">{moon.phaseName}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </GlassCard>
      <MoonSummary date={selectedDate} moon={selectedMoon} />
    </div>
  );
}
