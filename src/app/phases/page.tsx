import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MOON_PHASE_NAMES } from "@/constants/phases";

export default function PhasesPage() {
  return (
    <main className="py-10 sm:py-14">
      <Container>
        <SectionHeading
          eyebrow="Phases"
          title="Moon phase guide"
          description="The app recognizes four major phases and four intermediate labels."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MOON_PHASE_NAMES.map((phase) => (
            <GlassCard className="p-5" key={phase}>
              <div className="mb-4 h-12 w-12 rounded-full moon-mask" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">{phase}</h2>
            </GlassCard>
          ))}
        </div>
      </Container>
    </main>
  );
}
