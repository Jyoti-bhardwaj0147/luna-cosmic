"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { getMoonData } from "@/lib/astronomy/moon";
import { dateToLocalDate, formatLocalDate } from "@/lib/dates/local-date";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { MoonSummary } from "@/components/moon/MoonDetails";
import { MoonVisual } from "@/components/moon/MoonVisual";
import { LunarCalendar } from "@/components/calendar/LunarCalendar";

export function HomeExperience() {
  const prefersReducedMotion = useReducedMotion();
  const motionProps = prefersReducedMotion
    ? {}
    : {
        whileHover: { y: -2 },
        transition: { duration: 0.2 },
      };
  const today = useMemo(() => dateToLocalDate(new Date()), []);
  const moon = useMemo(() => getMoonData(today), [today]);

  return (
    <main className="flex-1">
      <section className="py-10 sm:py-14 lg:py-20">
        <Container>
          <motion.div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]" {...motionProps}>
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
          </motion.div>
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
