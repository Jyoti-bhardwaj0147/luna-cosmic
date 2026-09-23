"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";
import { getMoonData } from "@/lib/astronomy/moon";
import { dateToLocalDate, formatLocalDate } from "@/lib/dates/local-date";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { MoonSummary } from "@/components/moon/MoonDetails";
import { MoonVisual } from "@/components/moon/MoonVisual";
import { LunarCalendar } from "@/components/calendar/LunarCalendar";

const subscribe = () => () => {};
const getServerSnapshot = () => null;
const getLocalDaySnapshot = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export function HomeExperience() {
  const localDay = useSyncExternalStore(subscribe, getLocalDaySnapshot, getServerSnapshot);
  const today = useMemo(() => localDay === null ? null : dateToLocalDate(new Date(localDay)), [localDay]);
  const moon = useMemo(() => today === null ? null : getMoonData(today), [today]);

  if (localDay === null || !today || !moon) {
    return (
      <main className="flex-1">
        <section className="py-10 sm:py-14 lg:py-20">
          <Container>
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
              <div>
                <p className="text-sm font-semibold uppercase text-cyan">Your local calendar date</p>
                <div className="mt-4 h-10 w-52 rounded-md bg-white/[0.08]" />
                <div className="mt-4 h-12 w-72 rounded-md bg-white/[0.08]" />
                <div className="mt-5 h-5 w-full max-w-xl rounded-md bg-white/[0.08]" />
                <div className="mt-3 h-5 w-4/5 max-w-lg rounded-md bg-white/[0.08]" />
                <div className="mt-7 flex gap-3">
                  <div className="h-11 w-36 rounded-full bg-white/[0.08]" />
                  <div className="h-11 w-36 rounded-full bg-white/[0.08]" />
                </div>
              </div>
              <GlassCard className="flex min-h-[20rem] items-center justify-center p-8">
                <div className="aspect-square w-full max-w-sm rounded-full border border-border-subtle bg-surface" />
              </GlassCard>
            </div>
          </Container>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="py-10 sm:py-14 lg:py-20">
        <Container>
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
            <div>
              <p className="text-sm font-semibold uppercase text-cyan">
                {formatLocalDate(today, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                Luna Cosmic Violet
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                Track today&apos;s lunar phase, illumination, age, and nearby major phases with local calculations.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/calendar">
                  Open calendar <ArrowRight aria-hidden="true" size={18} />
                </ButtonLink>
                <ButtonLink href="/phases" variant="secondary">
                  View phases
                </ButtonLink>
              </div>
            </div>
            <GlassCard className="flex justify-center p-8">
              <MoonVisual moon={moon} />
            </GlassCard>
          </div>
        </Container>
      </section>

      <section className="pb-12 sm:pb-16">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <MoonSummary date={today} moon={moon} />
            <LunarCalendar initialDate={today} />
          </div>
        </Container>
      </section>
    </main>
  );
}