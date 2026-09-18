import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { TodayMoon } from "@/components/moon/TodayMoon";
import { TodayMoonContent } from "@/components/moon/TodayMoonContent";
import { createTodayMoonViewModel } from "@/components/moon/today-moon";

export default function TodayMoonPreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="py-12">
      <Container className="space-y-10">
        <header className="space-y-3">
          <p className="text-sm text-accent-light">Development design-system preview</p>
          <h1 className="font-display text-4xl sm:text-5xl">Today&apos;s Moon feature</h1>
          <p className="text-text-secondary">Live visitor-local date, followed by a fixed example and the pending state.</p>
        </header>
        <TodayMoon />
        <div className="space-y-4"><p className="text-sm text-text-secondary">Fixed-date example: September 18, 2026</p><TodayMoonContent model={createTodayMoonViewModel({ year: 2026, month: 9, day: 18 })} /></div>
        <div className="space-y-4"><p className="text-sm text-text-secondary">Pre-hydration preview</p><TodayMoonContent model={null} /></div>
      </Container>
    </main>
  );
}
