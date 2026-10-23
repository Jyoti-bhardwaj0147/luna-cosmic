import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MOON_PHASE_NAMES } from "@/constants/phases";
import { MoonVisual } from "@/components/moon/MoonVisual";
import type { MoonPhaseName } from "@/types/moon";
import type { Metadata } from "next";
import { siteUrl } from "../site-url";
import { SparklesCore } from "@/components/ui/sparkles";

export const metadata: Metadata = {
  title: "Moon Phase Guide",
  description: "Learn the eight Moon phases in order, from New Moon through waxing and waning phases, with representative illustrations.",
  ...(siteUrl ? { alternates: { canonical: "/phases" } } : {}),
};

const phaseGuide: Record<MoonPhaseName, { illumination: number; description: string }> = {
  "New Moon": { illumination: 0, description: "The side facing Earth is almost entirely dark. This marks the start of a new lunar cycle." },
  "Waxing Crescent": { illumination: 25, description: "A slim crescent grows after New Moon. Waxing means the illuminated portion is increasing." },
  "First Quarter": { illumination: 50, description: "Half of the visible disk is lit. The Moon is about a quarter of the way through its cycle." },
  "Waxing Gibbous": { illumination: 75, description: "More than half of the visible disk is lit, and the illuminated portion continues to grow toward Full Moon." },
  "Full Moon": { illumination: 100, description: "The visible disk is almost fully illuminated. This is the midpoint of the lunar cycle." },
  "Waning Gibbous": { illumination: 75, description: "After Full Moon, the illuminated portion begins to shrink, while more than half of the disk remains lit." },
  "Last Quarter": { illumination: 50, description: "Half of the visible disk is lit again, now waning. The Moon is about three quarters of the way through its cycle." },
  "Waning Crescent": { illumination: 25, description: "A narrowing crescent remains before the next New Moon, when the cycle begins again." },
};

export default function PhasesPage() {
  return (
    <main id="main-content" className="relative isolate overflow-hidden py-10 sm:py-14">
      <div aria-hidden="true" className="luna-phases-aurora pointer-events-none absolute inset-0" /> 
       <div className="w-full absolute inset-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>
      
      <Container className="relative z-[1]">
        <SectionHeading
          eyebrow="Phases"
          level="h1"
          title="Moon phase guide"
          description="8 phases in order, from New Moon to Waning Crescent. A complete cycle takes about 29.5 days."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MOON_PHASE_NAMES.map((phase) => (
            <GlassCard
              as="article"
              className="min-w-0 p-5"
              style={{ backgroundColor: "rgba(17, 13, 32, 0.38)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)" }}
              key={phase}
            >
              <MoonVisual phase={phase} illumination={phaseGuide[phase].illumination} size="sm" decorative showGlow={false} showOrbit={false} className="mb-4" />
              <h2 className="text-lg font-semibold text-foreground">{phase}</h2>
              <p className="mt-3 text-sm leading- tracking-wide text-muted">{phaseGuide[phase].description}</p>
            </GlassCard>
          ))}
        </div>
        
        
      </Container>
    </main>
  );
}
