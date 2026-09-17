import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  level?: "h1" | "h2" | "h3";
  className?: string;
};

export function SectionHeading({ eyebrow, title, description, action, level: Heading = "h2", className = "" }: SectionHeadingProps) {
  return (
    <div className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="max-w-3xl">
        {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
        <Heading className="font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.025em] text-text-primary">
          {title}
        </Heading>
        {description ? <p className="mt-4 max-w-[65ch] text-sm leading-7 text-text-secondary sm:text-base">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
