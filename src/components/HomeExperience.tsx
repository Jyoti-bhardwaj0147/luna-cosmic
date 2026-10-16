"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, CalendarDays, ChevronDown, Leaf, MapPin, MonitorSmartphone, MoonStar, Mouse, Sparkles } from "lucide-react";
import { getMoonData } from "@/lib/astronomy/moon";
import { dateToLocalDate, formatLocalDate } from "@/lib/dates/local-date";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MoonVisual } from "@/components/moon/MoonVisual";
import { LunarCalendar } from "@/components/calendar/LunarCalendar";
import { SectionHeading } from "@/components/ui/SectionHeading";

const phaseDateOptions = { month: "short", day: "numeric", year: "numeric" } as const;
const subscribe = () => () => {};
const getServerSnapshot = () => null;
const getLocalDaySnapshot = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

function ScrollCue() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex flex-col items-center gap-1 text-xs text-text-secondary motion-safe:animate-bounce sm:bottom-6">
      <span className="inline-flex items-center gap-2">
        <Mouse className="h-5 w-5 text-accent-light" />
        Scroll to explore
      </span>
      <ChevronDown className="h-5 w-5 text-text-primary" />
    </div>
  );
}

function WhyLunaIcon({ type }: { type: "moon" | "calendar" | "sparkles" | "location" | "responsive" | "leaf" }) {
  const commonProps = {
    className: "h-10 w-10 text-accent-light sm:h-12 sm:w-12",
    strokeWidth: 1.8,
    "aria-hidden": true,
  };

  switch (type) {
    case "moon":
      return <MoonStar {...commonProps} />;
    case "calendar":
      return <CalendarDays {...commonProps} />;
    case "sparkles":
      return <Sparkles {...commonProps} />;
    case "location":
      return <MapPin {...commonProps} />;
    case "responsive":
      return <MonitorSmartphone {...commonProps} />;
    case "leaf":
      return <Leaf {...commonProps} />;
    default:
      return null;
  }
}

const whyLunaFeatures = [
  {
    title: "Accurate Calculations",
    description: ["Real-time lunar data with", "precise calculations."],
    type: "moon" as const,
  },
  {
    title: "Interactive Calendar",
    description: ["Explore past and future", "moon phases."],
    type: "calendar" as const,
  },
  {
    title: "Beautiful Animations",
    description: ["Smooth transitions and", "immersive visuals."],
    type: "sparkles" as const,
  },
  {
    title: "No Location Needed",
    description: ["Explore moon phases without", "sharing your location."],
    type: "location" as const,
  },
  {
    title: "Fully Responsive",
    description: ["Perfect experience on", "all devices."],
    type: "responsive" as const,
  },
  {
    title: "Mindful Living",
    description: ["Align your plans with", "nature's rhythm."],
    type: "leaf" as const,
  },
] as const;

export function HomeExperience() {
  const mainRef = useRef<HTMLElement>(null);
  const localDay = useSyncExternalStore(subscribe, getLocalDaySnapshot, getServerSnapshot);
  const today = useMemo(() => localDay === null ? null : dateToLocalDate(new Date(localDay)), [localDay]);
  const moon = useMemo(() => today === null ? null : getMoonData(today), [today]);

  useEffect(() => {
    const main = mainRef.current;
    if (!main || !moon || typeof window.matchMedia !== "function") return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const hero = gsap.utils.toArray<HTMLElement>("[data-luna-hero]", main);
      gsap.fromTo(hero, { autoAlpha: 0.8, y: 18 }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power2.out",
        clearProps: "opacity,visibility,transform",
      });

      gsap.utils.toArray<HTMLElement>("[data-luna-reveal]", main).forEach((element) => {
        gsap.fromTo(element, { autoAlpha: 0.8, y: 20 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          clearProps: "opacity,visibility,transform",
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
        });
      });
    }, main);

    return () => media.revert();
  }, [moon]);

  if (localDay === null || !today || !moon) {
    return (
      <main className="luna-home flex-1">
        {/* Loading hero section: start */}
        <section className="luna-home-hero relative py-10 sm:py-14 lg:py-20">
          <div aria-hidden="true" className="luna-hero-background pointer-events-none absolute inset-0 bg-[url('/images/bg-hero.png')] bg-cover bg-center">
            <div className="absolute inset-0 bg-background/30" />
          </div>
          <Container className="relative">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="min-w-0 lg:col-span-6">
                <p className="text-sm font-semibold uppercase text-cyan">Your local calendar date</p>
                <div className="mt-4 h-10 w-52 rounded-md bg-white/[0.08]" />
                <div className="mt-4 h-12 w-full max-w-72 rounded-md bg-white/[0.08]" />
                <div className="mt-5 h-5 w-full max-w-xl rounded-md bg-white/[0.08]" />
                <div className="mt-3 h-5 w-4/5 max-w-lg rounded-md bg-white/[0.08]" />
                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="h-11 w-36 rounded-full bg-white/[0.08]" />
                  <div className="h-11 w-36 rounded-full bg-white/[0.08]" />
                </div>
              </div>
              <section className="flex min-h-[20rem] min-w-0 items-center justify-center p-8 lg:col-span-6">
                <div className="aspect-square w-full max-w-sm rounded-full border border-border-subtle bg-surface" />
              </section>
            </div>
          </Container>
          <ScrollCue />
        </section>
        {/* Loading hero section: end */}
      </main>
    );
  }

  const previousPhaseDateLabel = formatLocalDate(moon.previousMajorPhase.date, phaseDateOptions);
  const nextPhaseDateLabel = formatLocalDate(moon.nextMajorPhase.date, phaseDateOptions);

  return (
    <main ref={mainRef} className="luna-home flex-1">
      {/* Hero section: start */}
      <section className="luna-home-hero relative py-10 sm:py-14 lg:py-20">
        <div aria-hidden="true" className="luna-hero-background pointer-events-none absolute inset-0 bg-[url('/images/bg-hero.png')] bg-cover bg-center">
          <div className="absolute inset-0 bg-background/30" />
        </div>
        <Container className="relative">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-6">
              <p className="text-sm font-semibold uppercase text-cyan">
                The Moon, Every Day
              </p>
              <h1 data-luna-hero className="mt-4 max-w-3xl text-4xl font-display font-semibold leading-[0.9] text-foreground sm:text-7xl lg:text-6xl">
                Discover the Rhythm of <span className="bg-linear-to-r from-text-primary to-accent-light bg-clip-text text-transparent">the Moon</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                Track today&apos;s lunar phase, illumination, age, and nearby major phases with local calculations.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ButtonLink href="/calendar">
                  Open calendar <ArrowRight aria-hidden="true" size={18} />
                </ButtonLink>
                <ButtonLink href="/phases" variant="secondary">
                  View phases
                </ButtonLink>
              </div>
            </div>
            <section data-luna-hero className="mx-auto flex aspect-square w-full max-w-[30rem] min-w-0 items-center justify-center lg:col-span-6">
              {/* Fill the hero column; override the SVG's fixed width only here. */}
              <MoonVisual moon={moon} surfaceImageSrc="/images/moon.png" className="w-full!" />
            </section>
          </div>
        </Container>
        <ScrollCue />
      </section>
      {/* Hero section: end */}

      {/* Lunar calendar section: start */}
       <section className="relative pt-12 pb-12 sm:pb-16 lg:pt-16 lg:pb-20">
        <div aria-hidden="true" className="luna-calendar-background luna-section-shadow pointer-events-none absolute inset-0 bg-[url('/images/bg-calendar.png')] bg-cover bg-center">
          <div className="absolute inset-0 bg-background/30" />
        </div>
        <Container className="relative">
          <div className="relative z-[1] mb-8">
          <SectionHeading
            eyebrow="Lunar Calendar"
            title="Explore the Moon's Journey"
            description="Explore lunar phases for this week and next. Select a date to highlight it."
          />
        </div>
          <div data-luna-reveal className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
            <div className="col-span-12 [&_header>button]:invisible">
              <LunarCalendar initialDate={today} showSelectedDateDetails={false} showTwoWeeks  />
            </div>
          </div>
        </Container>
      </section>
      {/* Lunar calendar section: end */}


      {/* Today's Moon section: start */}
      <section className="luna-journey-today relative pt-12 pb-12 sm:pb-16 lg:pt-16 lg:pb-20">
        <div aria-hidden="true" className="luna-today-background luna-section-shadow pointer-events-none absolute inset-0 bg-[url('/images/bg-today-moon.png')] bg-cover bg-center">
          <div className="absolute inset-0 bg-background/30" />
        </div>
        
        <Container className="relative">
          <div data-luna-reveal className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_1.15fr] lg:items-center">
            <div className="flex min-w-0 items-center justify-center">
              <div className="relative mx-auto flex aspect-square w-full max-w-[31rem] items-center justify-center rounded-full border border-accent-light/40 bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.32),_rgba(15,23,42,0.2)_22%,_rgba(15,23,42,0.82)_100%)] shadow-[0_0_50px_rgba(168,85,247,0.35)]">
                <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                  <defs>
                    <radialGradient id="today-moon-pink-dot">
                      <stop stopColor="var(--luna-text-primary)" stopOpacity=".95" />
                      <stop offset=".25" stopColor="var(--luna-accent-light)" stopOpacity=".45" />
                      <stop offset="1" stopColor="var(--luna-accent-primary)" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="today-moon-blue-dot">
                      <stop stopColor="var(--luna-text-primary)" stopOpacity=".95" />
                      <stop offset=".25" stopColor="var(--luna-accent-blue)" stopOpacity=".45" />
                      <stop offset="1" stopColor="var(--luna-accent-blue)" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <g className="moon-orbit-dots">
                    {/* Symmetric bounds keep the rotation centred on the outer border. */}
                    <circle cx="50" cy="50" r="52" fill="transparent" />
                    {[0, 120, 240].map((angle, index) => (
                      <g key={angle} transform={`rotate(${angle} 50 50)`}>
                        <circle cx="50" cy="0" r="2" fill={`url(#today-moon-${index === 0 ? "pink" : "blue"}-dot)`} />
                        <circle cx="50" cy="0" r=".45" fill="var(--luna-text-primary)" />
                      </g>
                    ))}
                  </g>
                </svg>
                <div className="flex h-[85%] w-[85%] items-center justify-center ">
                  <MoonVisual decorative moon={moon} surfaceImageSrc="/images/moon.png" showGlow={false} size="xl" className="bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.82)_15%,_rgba(15,23,42,0.6)_82%,_rgba(15,23,42,0.82)_100%)] shadow-[0_0_80px_rgba(168,85,247,0.35)] rounded-full"/>
                </div>
              </div>
            </div>
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light sm:text-sm">
                Today&apos;s Moon
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-none tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
                {moon.phaseName}
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-text-secondary sm:text-lg">
                The moon is {Math.round(moon.illuminationPercentage)}% illuminated today. Explore its changing light and nearby major phases.
              </p>

              <section className="mt-6 max-w-xl border border-white/10 bg-white/[0.04] rounded-2xl p-4 shadow-[0_0_30px_rgba(139,92,246,0.12)] backdrop-blur-md sm:p-5">
                <dl className="space-y-3">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <dt className="text-sm text-text-secondary">Illumination</dt>
                    <dd className="text-base font-semibold text-text-primary">{Math.round(moon.illuminationPercentage)}%</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <dt className="text-sm text-text-secondary">Age</dt>
                    <dd className="text-base font-semibold text-text-primary">{moon.moonAgeDays.toFixed(1)}d</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <dt className="text-sm text-text-secondary">Previous</dt>
                    <dd className="min-w-0 text-right text-base font-semibold text-text-primary">
                      {moon.previousMajorPhase.name}
                      <span className="mt-1 block text-xs font-normal text-text-secondary">{previousPhaseDateLabel}</span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <dt className="text-sm text-text-secondary">Next</dt>
                    <dd className="min-w-0 text-right text-base font-semibold text-text-primary">
                      {moon.nextMajorPhase.name}
                      <span className="mt-1 block text-xs font-normal text-text-secondary">{nextPhaseDateLabel}</span>
                    </dd>
                  </div>
                </dl>
              </section>
            </div>


          </div>
        </Container>
      </section>
      {/* Today's Moon section: end */}

      {/* Why Luna section: start */}
      <section className="pt-12 pb-12 hidden sm:pb-16 lg:pt-16 lg:pb-20">
        <Container>
          <div data-luna-reveal className="grid gap-6 lg:grid-cols-[0.96fr_1.34fr] lg:items-start">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-light sm:text-sm">WHY LUNA?</p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-[0.9] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">
                More Than Just
                <span className="block">a Calendar</span>
              </h2>
              <p className="mt-6 max-w-[22rem] text-lg leading-8 text-text-secondary sm:text-[1.05rem]">
                Luna helps you understand the moon&apos;s
                <span className="block">influence, plan your life, and find beauty</span>
                <span className="block">in every phase.</span>
              </p>
              <ButtonLink href="/about" className="mt-8 w-auto rounded-full bg-[linear-gradient(110deg,var(--color-accent-primary),var(--color-accent-pink))] px-6 py-3 text-base text-text-primary shadow-[var(--shadow-accent)] hover:brightness-110">
                <span className="font-semibold">Learn More</span>
                <ArrowRight aria-hidden="true" size={18} />
              </ButtonLink>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {whyLunaFeatures.map((feature) => (
                <div key={feature.title} className="flex min-h-[11.5rem] flex-col items-center justify-center border border-accent-light/25 bg-[rgba(15,23,42,0.32)] p-5 text-center shadow-[0_0_35px_rgba(139,92,246,0.12)]">
                  <div className="mb-4 flex h-8 w-8 items-center justify-center  bg-transparent text-accent-light">
                    <WhyLunaIcon type={feature.type} />
                  </div>
                  <h3 className="text-center text-[1.05rem] font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-[1.05rem]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {feature.description.map((line) => (
                      <span key={line} className="block">{line}</span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
      {/* Why Luna section: end */}


      {/* Lunar journey CTA section: start */}
      <section className="luna-journey-cta hidden relative isolate overflow-hidden py-10 text-center sm:py-12 lg:py-16">
        <div aria-hidden="true" className="luna-journey-background luna-section-shadow pointer-events-none absolute inset-0 bg-[url('/images/bg-lunar-journey.png')] bg-cover bg-center">
          <div className="absolute inset-0 bg-background/30" />
        </div>
        <Container className="relative">
          <div data-luna-reveal className="mx-auto flex max-w-2xl flex-col items-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light sm:text-sm">
              Let the Moon Guide You
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-[0.9] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">
              Your Lunar Journey
              <span className="block">Starts Here</span>
            </h2>
            <p className="mt-3 text-base text-foreground sm:text-lg">Explore. Learn. Connect.</p>
            <ButtonLink href="/calendar" size="lg" className="mt-6">
              Explore Calendar <ArrowRight aria-hidden="true" size={18} />
            </ButtonLink>
          </div>
        </Container>
      </section>
      {/* Lunar journey CTA section: end */}

    </main>
  );
}
