import type { TodayMoonViewModel } from "./today-moon";

export function MoonStats({ model }: { model: TodayMoonViewModel }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-glass p-5 sm:p-6">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-6 min-[360px]:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-sm text-text-secondary">Illumination</dt>
          <dd className="mt-1 text-2xl font-medium tabular-nums text-text-primary">{model.illuminationLabel}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm text-text-secondary">Approximate Moon age</dt>
          <dd className="mt-1 text-2xl font-medium tabular-nums text-text-primary">{model.ageLabel}</dd>
        </div>
        <div className="min-w-0 border-t border-border-subtle pt-4">
          <dt className="text-sm text-text-secondary">Previous major phase</dt>
          <dd className="mt-2 text-base text-text-primary">{model.moon.previousMajorPhase.name}<span className="mt-1 block text-sm text-text-secondary">{model.previousPhaseDateLabel} (UTC)</span></dd>
        </div>
        <div className="min-w-0 border-t border-border-subtle pt-4">
          <dt className="text-sm text-text-secondary">Next major phase</dt>
          <dd className="mt-2 text-base text-text-primary">{model.moon.nextMajorPhase.name}<span className="mt-1 block text-sm text-text-secondary">{model.nextPhaseDateLabel} (UTC)</span></dd>
        </div>
        <div className="min-[360px]:col-span-2 border-t border-border-subtle pt-4">
          <dt className="text-sm text-text-secondary">Until the next major phase</dt>
          <dd className="mt-1 text-lg text-accent-light">{model.countdownLabel}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-relaxed text-text-secondary">Day estimate based on the phase&apos;s UTC date, not an exact countdown.</p>
    </div>
  );
}
