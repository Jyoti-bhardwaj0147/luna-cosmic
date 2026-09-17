import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { MoonVisual, type MoonVisualSize } from "@/components/moon/MoonVisual";
import type { MoonPhaseName } from "@/types/moon";

const phases: readonly [MoonPhaseName, number][] = [
  ["New Moon", 0], ["Waxing Crescent", 25], ["First Quarter", 50],
  ["Waxing Gibbous", 75], ["Full Moon", 100], ["Waning Gibbous", 75],
  ["Last Quarter", 50], ["Waning Crescent", 25],
];
const sizes: MoonVisualSize[] = ["xs", "sm", "md", "lg", "xl"];

/** Temporary, development-only visual verification. All examples are fixed. */
export default function MoonVisualPreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="py-12" style={{ background: "var(--luna-background)", color: "var(--luna-text-primary)" }}>
      <Container className="space-y-12">
        <header className="space-y-3">
          <p className="text-sm text-accent-light">Development design-system preview</p>
          <h1 className="font-display text-4xl sm:text-5xl">Reusable Moon visual</h1>
          <p className="max-w-2xl text-text-secondary">Fixed examples. Northern Hemisphere convention: waxing right, waning left. No live astronomy data.</p>
        </header>
        <section aria-labelledby="phases-heading" className="space-y-6">
          <h2 id="phases-heading" className="font-display text-3xl">Eight lunar phases</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {phases.map(([phase, illumination]) => (
              <GlassCard as="div" key={phase} className="min-w-0 p-4">
                <MoonVisual phase={phase} illumination={illumination} size="md" className="mx-auto" />
                <p className="mt-3 text-sm">{phase}<span className="block text-text-secondary">{illumination}% illuminated</span></p>
              </GlassCard>
            ))}
          </div>
        </section>
        <section aria-labelledby="sizes-heading" className="space-y-6">
          <h2 id="sizes-heading" className="font-display text-3xl">All five sizes</h2>
          <div className="flex flex-wrap items-end gap-6">
            {sizes.map(size => (
              <figure key={size} className="min-w-0 max-w-full">
                <MoonVisual phase="Waxing Gibbous" illumination={78} size={size} />
                <figcaption className="mt-2 text-sm">{size} / 78%</figcaption>
              </figure>
            ))}
          </div>
        </section>
        <section aria-labelledby="glow-heading" className="space-y-6">
          <h2 id="glow-heading" className="font-display text-3xl">Glow and accessibility</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <figure><MoonVisual phase="Full Moon" illumination={100} size="md" showGlow /><figcaption>Glow on, meaningful default name</figcaption></figure>
            <figure><MoonVisual phase="Full Moon" illumination={100} size="md" showGlow={false} label="Full Moon without glow" /><figcaption>Glow off, custom accessible name</figcaption></figure>
            <figure><MoonVisual phase="Waning Crescent" illumination={20} size="sm" decorative /><figcaption>Decorative: Waning Crescent, 20% illuminated</figcaption></figure>
          </div>
        </section>
        <section aria-labelledby="amount-heading" className="space-y-6">
          <h2 id="amount-heading" className="font-display text-3xl">Illumination boundary examples</h2>
          <div className="flex flex-wrap gap-6">
            {([["Waxing Crescent", 5], ["First Quarter", 50], ["Waxing Gibbous", 95]] as const).map(([phase, illumination]) => (
              <figure key={illumination}><MoonVisual phase={phase} illumination={illumination} size="sm" /><figcaption>{illumination}% illuminated</figcaption></figure>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
