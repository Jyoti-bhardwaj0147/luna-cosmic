import { useId } from "react";
import { MoonVisual } from "@/components/moon/MoonVisual";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatLocalDate } from "@/lib/dates/local-date";
import type { LocalDate, MoonData, MoonMajorPhase } from "@/types/moon";

type SelectedDateDetailsProps = {
  date: LocalDate;
  moon: MoonData;
};

const fullDateOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
} as const;

const phaseDateOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
} as const;

function toDateTime(date: LocalDate): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function MajorPhaseValue({ phase }: { phase: MoonMajorPhase }) {
  return (
    <>
      <span className="block font-semibold text-text-primary">{phase.name}</span>
      <time className="mt-1 block text-xs text-text-secondary" dateTime={toDateTime(phase.date)}>
        {formatLocalDate(phase.date, phaseDateOptions)}
      </time>
    </>
  );
}

export function SelectedDateDetails({ date, moon }: SelectedDateDetailsProps) {
  const headingId = useId();

  return (
    <aside aria-labelledby={headingId}>
      <GlassCard as="div" className="h-full p-5 sm:p-6">
        <div className="flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-light">Selected date</p>
          <time className="mt-2 text-sm leading-6 text-text-secondary" dateTime={toDateTime(date)}>
            {formatLocalDate(date, fullDateOptions)}
          </time>
          <MoonVisual
            className="mt-5"
            decorative
            illumination={moon.illuminationPercentage}
            phase={moon.phaseName}
            size="md"
          />
          <h3 className="mt-4 font-display text-3xl font-semibold leading-tight text-text-primary" id={headingId}>
            {moon.phaseName}
          </h3>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border-subtle bg-white/[0.035] p-3">
            <dt className="text-xs text-text-secondary">Illumination</dt>
            <dd className="mt-1 text-lg font-semibold text-text-primary">
              {Math.round(moon.illuminationPercentage)}%
            </dd>
          </div>
          <div className="rounded-xl border border-border-subtle bg-white/[0.035] p-3">
            <dt className="text-xs text-text-secondary">Moon age</dt>
            <dd className="mt-1 text-lg font-semibold text-text-primary">
              {moon.moonAgeDays.toFixed(1)} days
            </dd>
          </div>
          <div className="col-span-2 rounded-xl border border-border-subtle bg-white/[0.035] p-3">
            <dt className="text-xs text-text-secondary">Previous major phase</dt>
            <dd className="mt-1"><MajorPhaseValue phase={moon.previousMajorPhase} /></dd>
          </div>
          <div className="col-span-2 rounded-xl border border-border-subtle bg-white/[0.035] p-3">
            <dt className="text-xs text-text-secondary">Next major phase</dt>
            <dd className="mt-1"><MajorPhaseValue phase={moon.nextMajorPhase} /></dd>
          </div>
        </dl>
      </GlassCard>
    </aside>
  );
}
