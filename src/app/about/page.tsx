import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

export default function AboutPage() {
  return (
    <main className="py-10 sm:py-14">
      <Container>
        <SectionHeading
          eyebrow="About"
          title="Local lunar calculations"
          description="Luna Cosmic Violet estimates phase, illumination, age, and surrounding major phases from local calendar dates."
        />
        <GlassCard className="mt-8 max-w-3xl p-6 text-sm leading-7 text-muted sm:text-base">
          <p>
            The selected date is treated as a civil date and sampled at UTC noon for stable calculations. The app does not use geolocation, moonrise, moonset, server persistence, or external Moon APIs.
          </p>
        </GlassCard>
      </Container>
    </main>
  );
}
