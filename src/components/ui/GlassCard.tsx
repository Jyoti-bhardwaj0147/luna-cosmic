import type { PropsWithChildren } from "react";

export function GlassCard({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={`rounded-lg border border-white/15 bg-white/[0.08] shadow-[var(--shadow)] backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  );
}
