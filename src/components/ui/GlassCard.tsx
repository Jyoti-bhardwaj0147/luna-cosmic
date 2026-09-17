import type { HTMLAttributes } from "react";

type GlassCardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "div" | "section";
};

export function GlassCard({
  as: Component = "section",
  children,
  className = "",
  ...props
}: GlassCardProps) {
  return (
    <Component className={`cosmic-glass rounded-2xl ${className}`} {...props}>
      {children}
    </Component>
  );
}
