import { useId } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MoonVisual } from "./MoonVisual";
import { MoonStats } from "./MoonStats";
import type { TodayMoonViewModel } from "./today-moon";

/** Server-compatible presentation; null is the truthful pre-hydration state. */
export function TodayMoonContent({ model }: { model: TodayMoonViewModel | null }) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="cosmic-atmosphere rounded-3xl bg-background px-5 py-10 text-text-primary sm:px-8 sm:py-12 lg:px-12">
      <div className="grid min-w-0 grid-cols-1 items-center gap-x-12 gap-y-8 lg:grid-cols-2">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <Eyebrow>Today&apos;s Moon</Eyebrow>
          <p className="mt-4 min-h-6 text-sm text-text-secondary">{model ? <time dateTime={model.dateTime}>{model.dateLabel}</time> : "Your local calendar date"}</p>
          <h2 id={headingId} className="mt-3 font-display text-5xl leading-tight sm:text-6xl">{model ? model.moon.phaseName : "Today's Moon"}</h2>
          <p className="mt-4 min-h-20 max-w-xl text-base leading-relaxed text-text-secondary" role={model ? undefined : "status"}>
            {model ? model.description : "Preparing Moon details for your local date. They will appear once this page is ready."}
          </p>
        </div>
        <div className="mx-auto flex min-w-0 aspect-square w-full max-w-md items-center justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-hidden="true">
          {model ? <MoonVisual phase={model.moon.phaseName} illumination={model.moon.illuminationPercentage} size="xl" decorative /> : <div className="aspect-square w-full max-w-sm rounded-full border border-border-subtle bg-surface" />}
        </div>
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          {model ? <MoonStats model={model} /> : <div aria-hidden="true" className="min-h-96 rounded-2xl border border-border-subtle bg-surface-glass p-6"><div className="h-4 w-1/2 rounded bg-surface-strong" /><div className="mt-8 h-16 rounded bg-surface-strong" /><div className="mt-6 h-24 rounded bg-surface-strong" /></div>}
        </div>
      </div>
    </section>
  );
}
