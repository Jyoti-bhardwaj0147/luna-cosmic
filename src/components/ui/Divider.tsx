import type { HTMLAttributes } from "react";

export function Divider({ className = "", ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={`h-px w-full border-0 bg-[linear-gradient(90deg,transparent,var(--color-border-strong),transparent)] ${className}`} {...props} />;
}
