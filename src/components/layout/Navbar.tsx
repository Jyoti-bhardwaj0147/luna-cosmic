"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import Image from "next/image";

function GitHubLink({ onClick }: { onClick?: () => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.a
      href="https://github.com/Jyoti-bhardwaj0147/luna-cosmic"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Luna Cosmic on GitHub"
      onClick={onClick}
      className="inline-flex h-11 shrink-0 items-center justify-center self-start rounded-xl border border-transparent px-5 text-text-secondary hover:bg-surface-glass hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-light motion-safe:transition-colors motion-safe:duration-200 sm:w-11 sm:self-auto sm:rounded-full sm:px-0"
      whileHover={reduceMotion ? undefined : { y: -2, scale: 1.08 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.597 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    </motion.a>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !navRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 640px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
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
        <nav
          ref={navRef}
          className="relative flex h-[72px] items-center justify-between gap-3 py-3"
          aria-label="Primary navigation"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setOpen(false);
          }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            {/* <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-cyan">
              <MoonStar aria-hidden="true" size={20} />
            </span>
            Luna Cosmic */}
            <Image
              src="/images/logo.png"
              alt="Luna Cosmic Logo"
              className="h-auto"
              width={100}
              height={100}
              loading="eager"
            />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen(!open)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent-light/40 bg-surface text-text-primary hover:border-accent-light hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-light motion-safe:transition-colors motion-safe:duration-200 sm:hidden"
          >
            {open ? (
              <X aria-hidden="true" size={22} />
            ) : (
              <Menu aria-hidden="true" size={22} />
            )}
          </button>
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <ButtonLink href="/" variant="ghost">
              Home
            </ButtonLink>
            <ButtonLink href="/calendar" variant="ghost">
              Calendar
            </ButtonLink>
            <ButtonLink href="/phases" variant="ghost">
              Phases
            </ButtonLink>
            <GitHubLink />
            {/* <ButtonLink href="/about" variant="secondary">About</ButtonLink> */}
          </div>
          <div
            id="mobile-navigation"
            inert={!open}
            aria-hidden={!open}
            className={`absolute inset-x-0 top-full grid overflow-hidden rounded-2xl border border-accent-light/25 bg-surface shadow-[var(--shadow-soft)] motion-safe:transition-[grid-template-rows,opacity,visibility] motion-safe:duration-300 motion-safe:ease-out sm:hidden ${open ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"}`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="flex max-h-[calc(100svh-6rem)] flex-col gap-1 overflow-y-auto p-3">
                <ButtonLink
                  href="/"
                  variant="ghost"
                  className="justify-start! rounded-xl! text-text-primary!"
                  onClick={() => setOpen(false)}
                >
                  Home
                </ButtonLink>
                <ButtonLink
                  href="/calendar"
                  variant="ghost"
                  className="justify-start! rounded-xl! text-text-primary!"
                  onClick={() => setOpen(false)}
                >
                  Calendar
                </ButtonLink>
                <ButtonLink
                  href="/phases"
                  variant="ghost"
                  className="justify-start! rounded-xl! text-text-primary!"
                  onClick={() => setOpen(false)}
                >
                  Phases
                </ButtonLink>
                <GitHubLink onClick={() => setOpen(false)} />
              </div>
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}
