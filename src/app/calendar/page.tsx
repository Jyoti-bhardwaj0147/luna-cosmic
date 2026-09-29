import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LunarCalendar } from "@/components/calendar/LunarCalendar";

export default function CalendarPage() {
  return (
    <main className="relative isolate py-10 sm:py-14 bg-[url('/images/bg-calendar.png')] bg-cover bg-center bg-fixed">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-background/30" />
      <Container className="relative z-[1]">
        <div className="relative z-[1] mb-8">
          <SectionHeading
            eyebrow="Calendar"
            title="Monthly lunar calendar"
            description="Select a date to update phase, illumination, age, and surrounding major phases."
          />
        </div>
        <LunarCalendar />
      </Container>
    </main>
  );
}
