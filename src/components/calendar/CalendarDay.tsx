import type { KeyboardEvent, Ref } from "react";
import { MoonVisual } from "@/components/moon/MoonVisual";
import { formatLocalDate } from "@/lib/dates/local-date";
import type { LocalDate, MoonData } from "@/types/moon";

type CalendarDayProps = {
  date: LocalDate;
  moon: MoonData;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  tabIndex: 0 | -1;
  buttonRef: Ref<HTMLButtonElement>;
  onActivate: (date: LocalDate) => void;
  onFocusDate: (date: LocalDate) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, date: LocalDate) => void;
};

const fullDateOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
} as const;

const shortMonthOptions = { month: "short" } as const;

export function CalendarDay({
  date,
  moon,
  isCurrentMonth,
  isSelected,
  isToday,
  tabIndex,
  buttonRef,
  onActivate,
  onFocusDate,
  onKeyDown,
}: CalendarDayProps) {
  const fullDate = formatLocalDate(date, fullDateOptions);
  const roundedIllumination = Math.round(moon.illuminationPercentage);
  const adjacentDescription = isCurrentMonth ? "" : ", outside the displayed month";

  return (
    <td className="p-0.5 align-top sm:p-1">
      <button
        ref={buttonRef}
        type="button"
        tabIndex={tabIndex}
        aria-current={isToday ? "date" : undefined}
        aria-label={`${fullDate}; ${moon.phaseName}; ${roundedIllumination}% illuminated${adjacentDescription}`}
        aria-pressed={isSelected}
        className={`relative flex min-h-[4.75rem] w-full min-w-0 flex-col items-center justify-center rounded-xl border px-0.5 py-1.5 text-center focus-visible:z-10 focus-visible:border-accent-blue focus-visible:outline-[3px]! focus-visible:outline-solid! focus-visible:outline-accent-blue! focus-visible:outline-offset-2! sm:min-h-24 sm:px-1 ${
          isSelected
            ? "border-2 border-accent-light bg-accent-primary/15 text-text-primary shadow-[0_0_24px_rgba(139,92,246,0.28)]"
            : isCurrentMonth
              ? "border-border-subtle bg-white/[0.025] text-text-primary hover:border-border-strong hover:bg-white/[0.055]"
              : "border-dashed border-border-subtle bg-transparent text-text-muted hover:border-border-strong hover:bg-white/[0.035]"
        } ${isToday ? "ring-1 ring-inset ring-accent-blue/80" : ""}`}
        onClick={() => onActivate(date)}
        onFocus={() => onFocusDate(date)}
        onKeyDown={(event) => onKeyDown(event, date)}
      >
        <span className="absolute left-1.5 top-1 text-[0.6875rem] font-semibold leading-none sm:left-2 sm:top-1.5 sm:text-xs">
          {date.day}
        </span>
        {!isCurrentMonth ? (
          <span className="absolute right-1 top-1 text-[0.5rem] font-semibold uppercase leading-none tracking-wide sm:right-1.5 sm:top-1.5">
            {formatLocalDate(date, shortMonthOptions)}
          </span>
        ) : null}
        <MoonVisual
          decorative
          illumination={moon.illuminationPercentage}
          phase={moon.phaseName}
          showGlow={false}
          size="xs"
        />
        {isToday ? (
          <span aria-hidden="true" className="absolute bottom-0.5 text-[0.5rem] font-bold uppercase tracking-[0.08em] text-accent-blue sm:bottom-1">
            Today
          </span>
        ) : null}
      </button>
    </td>
  );
}
