import type { HTMLAttributes } from "react";

type BadgeVariant = "violet" | "pink" | "blue" | "neutral";
type BadgeProps = HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant };

const variants: Record<BadgeVariant, string> = {
  violet: "border-accent-primary/35 bg-accent-primary/10 text-accent-light",
  pink: "border-accent-pink/35 bg-accent-pink/10 text-accent-pink",
  blue: "border-accent-blue/35 bg-accent-blue/10 text-accent-blue",
  neutral: "border-border-subtle bg-surface-glass text-text-secondary",
};

export function Badge({ children, className = "", variant = "violet", ...props }: BadgeProps) {
  return <span className={`inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${variants[variant]} ${className}`} {...props}>{children}</span>;
}
