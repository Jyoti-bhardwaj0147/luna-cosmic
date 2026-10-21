import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import type { Metadata } from "next";
import { siteUrl } from "../site-url";

export const metadata: Metadata = {
  title: "About",
  description: "Learn how Luna calculates daily Moon details locally, how to use its calendar, and what its estimates include.",
  ...(siteUrl ? { alternates: { canonical: "/about" } } : {}),
};

export default function AboutPage() {
  return (
    <main id="main-content" className="py-10 sm:py-14">
      <Container>
        <SectionHeading
          eyebrow="About"
          level="h1"
          title="A closer look at Luna"
          description="Explore the Moon one day at a time. Luna brings phase, illumination, approximate age, and nearby major phases together in a lunar calendar."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <GlassCard className="min-w-0 p-6">
            <h2 className="text-lg font-semibold text-foreground">Start with your date</h2>
            <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
              Luna opens on today according to your device&apos;s local calendar.
              Browse months in the calendar and select a day to see its Moon details.
              With a keyboard, use the arrow keys to move between dates and Enter or
              Space to select one.
            </p>
          </GlassCard>
          <GlassCard className="min-w-0 p-6">
            <h2 className="text-lg font-semibold text-foreground">Understand the details</h2>
            <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
              Illumination describes how much of the visible lunar disk is sunlit.
              Moon age is an approximate position in a 29.5-day cycle, expressed in
              days. The previous and next major phases help place your selected date
              within that cycle.
            </p>
          </GlassCard>
          <GlassCard className="min-w-0 p-6">
            <h2 className="text-lg font-semibold text-foreground">How calculations work</h2>
            <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
              Luna uses the Astronomy Engine library locally, without an external
              Moon-data service. Each selected calendar date is sampled at 12:00 UTC
              for a consistent daily reading. These are daily estimates, rather than
              a live view of the Moon at your current time.
            </p>
          </GlassCard>
          <GlassCard className="min-w-0 p-6">
            <h2 className="text-lg font-semibold text-foreground">No location needed</h2>
            <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
              Luna does not request your location or require an account. Calendar
              selections are not saved to a database. Moonrise, moonset, and local
              viewing conditions are outside the scope of this calendar.
            </p>
          </GlassCard>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/calendar" variant="secondary">Explore the lunar calendar</ButtonLink>
          <ButtonLink href="/phases" variant="ghost">Read the phase guide</ButtonLink>
        </div>
      </Container>
    </main>
  );
}
