import type { LocalDate, MoonData } from "@/types/moon";
import { formatLocalDate } from "@/lib/dates/local-date";
import { GlassCard } from "@/components/ui/GlassCard";
import { MoonVisual } from "@/components/moon/MoonVisual";

type MoonSummaryProps = {
  date: LocalDate;
  moon: MoonData;
};

export function MoonSummary({ date, moon }: MoonSummaryProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex flex-col items-center gap-5 text-center">
        <MoonVisual moon={moon} size="sm" />
        <div>
          <p className="text-sm text-muted">{formatLocalDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">{moon.phaseName}</h2>
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-white/[0.06] p-3">
          <dt className="text-muted">Illumination</dt>
          <dd className="mt-1 text-lg font-semibold text-foreground">{Math.round(moon.illuminationPercentage)}%</dd>
        </div>
        <div className="rounded-lg bg-white/[0.06] p-3">
          <dt className="text-muted">Age</dt>
          <dd className="mt-1 text-lg font-semibold text-foreground">{moon.moonAgeDays.toFixed(1)}d</dd>
        </div>
        <div className="rounded-lg bg-white/[0.06] p-3">
          <dt className="text-muted">Previous</dt>
          <dd className="mt-1 font-semibold text-foreground">{moon.previousMajorPhase.name}</dd>
        </div>
        <div className="rounded-lg bg-white/[0.06] p-3">
          <dt className="text-muted">Next</dt>
          <dd className="mt-1 font-semibold text-foreground">{moon.nextMajorPhase.name}</dd>
        </div>
      </dl>
    </GlassCard>
  );
}

export function MoonDetails(props: MoonSummaryProps) {
  return <MoonSummary {...props} />;
}
