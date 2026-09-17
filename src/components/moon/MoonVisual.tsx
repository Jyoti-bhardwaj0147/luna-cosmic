import { useId } from "react";
import type { MoonData, MoonPhaseName } from "@/types/moon";

export type MoonVisualSize = "xs" | "sm" | "md" | "lg" | "xl";

type PresentationProps = {
  size?: MoonVisualSize;
  label?: string;
  decorative?: boolean;
  showGlow?: boolean;
  className?: string;
};

export type MoonVisualProps = PresentationProps & (
  | { phase: MoonPhaseName; illumination: number; moon?: never }
  /** Compatibility for existing callers; both APIs share the same renderer. */
  | { moon: MoonData; phase?: never; illumination?: never }
);

const sizes: Record<MoonVisualSize, string> = {
  xs: "2rem", sm: "6rem", md: "10rem", lg: "16rem", xl: "26rem",
};

// Fixed surface features keep server/client markup deterministic.
const craters = [
  [34, 30, 11, 8], [59, 24, 8, 10], [66, 42, 13, 10],
  [38, 57, 10, 13], [60, 69, 8, 6], [24, 47, 5, 7],
  [45, 78, 5, 4], [73, 59, 4, 5], [48, 40, 3, 3],
] as const;

/**
 * Presentation only. Northern Hemisphere convention: waxing/right, waning/left.
 * Percentage controls lit area even if it disagrees with the supplied phase.
 * Finite values clamp to 0..100; nonfinite values fall back to 0, without
 * changing the source astronomy data. No time, location or astronomy is read.
 */
export function MoonVisual(props: MoonVisualProps) {
  const { size = "lg", label, decorative = false, showGlow = true, className = "" } = props;
  const phase = props.moon ? props.moon.phaseName : props.phase;
  const input = props.moon ? props.moon.illuminationPercentage : props.illumination;
  const illumination = Number.isFinite(input) ? Math.max(0, Math.min(100, input)) : 0;
  const waning = phase === "Last Quarter" || phase === "Waning Crescent" || phase === "Waning Gibbous";
  const id = useId().replace(/:/g, "");
  const surfaceId = `moon-surface-${id}`;
  const rimId = `moon-rim-${id}`;
  const haloId = `moon-halo-${id}`;
  const clipId = `moon-light-${id}`;
  const terminatorRadius = Math.abs(1 - illumination / 50) * 44;
  // Outer arc runs down the right limb. The return arc curves inward for a
  // crescent and outward for a gibbous. A quarter has a straight terminator.
  const path = `M 50 6 A 44 44 0 0 1 50 94 ${illumination === 50
    ? "L 50 6"
    : `A ${terminatorRadius} 44 0 0 ${illumination < 50 ? 0 : 1} 50 6`} Z`;
  const phaseLabel = phase.endsWith("Moon") ? phase : `${phase} Moon`;
  const accessibleLabel = label?.trim() || `${phaseLabel}, ${Math.round(illumination)} percent illuminated`;
  const glow = showGlow && size !== "xs";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="100"
      height="100"
      className={`block max-w-full shrink-0 ${className}`}
      style={{ width: sizes[size], maxWidth: "100%", height: "auto", aspectRatio: "1 / 1" }}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : accessibleLabel}
      focusable="false"
      data-phase={phase}
      data-orientation={waning ? "left" : "right"}
      data-illumination={illumination}
      data-size={size}
      data-glow={glow}
    >
      <defs aria-hidden="true">
        <radialGradient id={surfaceId} cx="36%" cy="29%" r="78%">
          <stop stopColor="var(--luna-text-primary)" />
          <stop offset=".65" stopColor="var(--luna-text-secondary)" />
          <stop offset="1" stopColor="var(--luna-accent-light)" />
        </radialGradient>
        <linearGradient id={rimId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="var(--luna-accent-blue)" stopOpacity=".35" />
          <stop offset=".55" stopColor="var(--luna-accent-light)" stopOpacity=".7" />
          <stop offset="1" stopColor="var(--luna-accent-primary)" stopOpacity=".3" />
        </linearGradient>
        <radialGradient id={haloId}>
          <stop offset=".78" stopColor="var(--luna-accent-blue)" stopOpacity="0" />
          <stop offset=".88" stopColor="var(--luna-accent-primary)" stopOpacity={size === "sm" ? ".12" : ".25"} />
          <stop offset="1" stopColor="var(--luna-accent-blue)" stopOpacity="0" />
        </radialGradient>
        <clipPath id={clipId}>
          {illumination === 100 ? <circle cx="50" cy="50" r="44" /> :
            illumination > 0 ? <path d={path} transform={waning ? "translate(100 0) scale(-1 1)" : undefined} /> : null}
        </clipPath>
      </defs>
      <g aria-hidden="true">
        {glow ? <circle cx="50" cy="50" r="50" fill={`url(#${haloId})`} /> : null}
        <circle cx="50" cy="50" r="44" fill="var(--luna-surface-elevated)" />
        <g clipPath={`url(#${clipId})`}>
          <circle cx="50" cy="50" r="44" fill={`url(#${surfaceId})`} />
          {craters.slice(0, size === "xs" ? 4 : craters.length).map(([cx, cy, rx, ry]) => (
            <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry}
              fill="var(--luna-surface-strong)" fillOpacity=".23"
              stroke="var(--luna-text-primary)" strokeOpacity=".15" strokeWidth=".45" />
          ))}
          {size !== "xs" && size !== "sm" ? (
            <g fill="var(--luna-text-primary)" opacity=".3">
              <circle cx="55" cy="57" r="2.3" /><circle cx="31" cy="69" r="1.7" />
              <circle cx="77" cy="33" r="1.2" /><circle cx="45" cy="19" r="1" />
            </g>
          ) : null}
        </g>
        <circle cx="50" cy="50" r="44" fill="none" stroke={`url(#${rimId})`} strokeWidth=".6" />
      </g>
    </svg>
  );
}
