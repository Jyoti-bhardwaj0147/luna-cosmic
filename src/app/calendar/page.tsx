import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LunarCalendar } from "@/components/calendar/LunarCalendar";

export default function CalendarPage() {
  return (
    <main className="py-10 sm:py-14">
      <Container>
        <div className="mb-8">
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
