"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import Image from "next/image";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !navRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 640px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-[999]  bg-background/60 shadow-[var(--shadow-soft)] backdrop-blur-sm transition-shadow duration-300">
      <Container>
        <nav ref={navRef} className="relative flex h-[72px] items-center justify-between gap-3 py-3" aria-label="Primary navigation"
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            {/* <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-cyan">
              <MoonStar aria-hidden="true" size={20} />
            </span>
            Luna Cosmic */}
            <Image src="/images/logo.png" alt="Luna Cosmic Logo" className="" width={100} height={100} loading="eager" />
          </Link>
          <button ref={toggleRef} type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen(!open)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent-light/40 bg-surface text-text-primary hover:border-accent-light hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-light motion-safe:transition-colors motion-safe:duration-200 sm:hidden">
            {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
          </button>
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <ButtonLink href="/" variant="ghost">Home</ButtonLink>
            <ButtonLink href="/calendar" variant="ghost">Calendar</ButtonLink>
            <ButtonLink href="/phases" variant="ghost">Phases</ButtonLink>
            {/* <ButtonLink href="/about" variant="secondary">About</ButtonLink> */}
          </div>
          <div id="mobile-navigation" inert={!open} aria-hidden={!open}
            className={`absolute inset-x-0 top-full grid overflow-hidden rounded-2xl border border-accent-light/25 bg-surface shadow-[var(--shadow-soft)] motion-safe:transition-[grid-template-rows,opacity,visibility] motion-safe:duration-300 motion-safe:ease-out sm:hidden ${open ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"}`}>
            <div className="min-h-0 overflow-hidden">
              <div className="flex max-h-[calc(100svh-6rem)] flex-col gap-1 overflow-y-auto p-3">
                <ButtonLink href="/" variant="ghost" className="justify-start! rounded-xl! text-text-primary!" onClick={() => setOpen(false)}>Home</ButtonLink>
                <ButtonLink href="/calendar" variant="ghost" className="justify-start! rounded-xl! text-text-primary!" onClick={() => setOpen(false)}>Calendar</ButtonLink>
                <ButtonLink href="/phases" variant="ghost" className="justify-start! rounded-xl! text-text-primary!" onClick={() => setOpen(false)}>Phases</ButtonLink>
              </div>
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}
