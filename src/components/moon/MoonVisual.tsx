import type { MoonData } from "@/types/moon";

type MoonVisualProps = {
  moon: MoonData;
  size?: "sm" | "lg";
};

export function MoonVisual({ moon, size = "lg" }: MoonVisualProps) {
  const diameter = size === "lg" ? "h-52 w-52 sm:h-64 sm:w-64" : "h-24 w-24";
  const shadowOffset = `${(moon.phaseFraction - 0.5) * 140}%`;

  return (
    <div className={`relative ${diameter}`} aria-label={`${moon.phaseName}, ${Math.round(moon.illuminationPercentage)} percent illuminated`} role="img">
      <div className="moon-mask h-full w-full rounded-full" />
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-background/70 mix-blend-multiply"
        style={{ transform: `translateX(${shadowOffset})` }}
      />
      <div className="absolute inset-0 rounded-full ring-1 ring-white/20" aria-hidden="true" />
    </div>
  );
}
