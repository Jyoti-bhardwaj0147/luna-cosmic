import type { HTMLAttributes } from "react";

export function Eyebrow({ children, className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-xs font-semibold uppercase tracking-[0.2em] text-accent-light ${className}`} {...props}>{children}</p>;
}
