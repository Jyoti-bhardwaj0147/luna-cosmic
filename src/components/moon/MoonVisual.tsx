import { useId } from "react";
import type { MoonData, MoonPhaseName } from "@/types/moon";

export type MoonVisualSize = "xs" | "sm" | "md" | "lg" | "xl";

type PresentationProps = {
  // Choose a width preset below; the SVG still shrinks to fit its container.
  size?: MoonVisualSize;
  // Override the screen-reader description, or hide purely decorative Moons.
  label?: string;
  decorative?: boolean;
  // Toggle the halo, outer ring and orbiting dots together (always off at xs).
  showGlow?: boolean;
  // Hide only the outer ring and dots while retaining the halo.
  showOrbit?: boolean;
  // Override the shared Moon image; the existing phase shadow controls illumination.
  surfaceImageSrc?: string;
  // Extra layout classes supplied by the component's parent.
  className?: string;
};

export type MoonVisualProps = PresentationProps & (
  | { phase: MoonPhaseName; illumination: number; moon?: never }
  /** Compatibility for existing callers; both APIs share the same renderer. */
  | { moon: MoonData; phase?: never; illumination?: never }
);

// EDIT SIZE: these widths include the whole SVG, including the orbit when shown.
const sizes: Record<MoonVisualSize, string> = {
  xs: "2rem", sm: "6rem", md: "10rem", lg: "16rem", xl: "26rem",
};

// EDIT CRATERS: each entry is [centre x, centre y, horizontal radius, vertical radius].
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
  const { size = "lg", label, decorative = false, showGlow = true, showOrbit = true, surfaceImageSrc = "/images/moon.png", className = "" } = props;
  // Read either supported input format and keep the lit percentage within 0..100.
  const phase = props.moon ? props.moon.phaseName : props.phase;
  const input = props.moon ? props.moon.illuminationPercentage : props.illumination;
  const illumination = Number.isFinite(input) ? Math.max(0, Math.min(100, input)) : 0;
  const waning = phase === "Last Quarter" || phase === "Waning Crescent" || phase === "Waning Gibbous";
  // Unique SVG IDs prevent gradients/clipping from affecting other Moon instances.
  const id = useId().replace(/:/g, "");
  const surfaceId = `moon-surface-${id}`;
  const rimId = `moon-rim-${id}`;
  const haloId = `moon-halo-${id}`;
  const pinkDotId = `moon-pink-dot-${id}`;
  const blueDotId = `moon-blue-dot-${id}`;
  const clipId = `moon-light-${id}`;
  const discClipId = `moon-disc-${id}`;
  const shadowMaskId = `moon-shadow-${id}`;
  const shadowBlurId = `moon-shadow-blur-${id}`;
  // PHASE SHAPE: the Moon is centred at (50, 50), radius 44; this controls its lit edge.
  const terminatorRadius = Math.abs(1 - illumination / 50) * 44;
  // Outer arc runs down the right limb. The return arc curves inward for a
  // crescent and outward for a gibbous. A quarter has a straight terminator.
  const path = `M 50 6 A 44 44 0 0 1 50 94 ${illumination === 50
    ? "L 50 6"
    : `A ${terminatorRadius} 44 0 0 ${illumination < 50 ? 0 : 1} 50 6`} Z`;
  // Accessible description and the compact-calendar glow exception.
  const phaseLabel = phase.endsWith("Moon") ? phase : `${phase} Moon`;
  const accessibleLabel = label?.trim() || `${phaseLabel}, ${Math.round(illumination)} percent illuminated`;
  const glow = showGlow && size !== "xs";

  // RESPONSIVE FRAME: the larger glow viewBox leaves room for the moving dot halos.
  // maxWidth + auto height preserve a circle on narrow screens. If you enlarge the
  // orbit/glows, expand the viewBox symmetrically around (50, 50) to avoid clipping.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={glow ? "-12 -12 124 124" : "0 0 100 100"}
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
        {/* MOON COLOUR: gradient for the illuminated surface. */}
        <radialGradient id={surfaceId} cx="36%" cy="29%" r="78%">
          <stop stopColor="var(--luna-text-primary)" />
          <stop offset=".65" stopColor="var(--luna-text-secondary)" />
          <stop offset="1" stopColor="var(--luna-accent-light)" />
        </radialGradient>
        {/* RIM COLOUR: shared by the Moon outline and the outer orbit ring. */}
        <linearGradient id={rimId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="var(--luna-accent-blue)" stopOpacity=".35" />
          <stop offset=".55" stopColor="var(--luna-accent-light)" stopOpacity=".7" />
          <stop offset="1" stopColor="var(--luna-accent-primary)" stopOpacity=".3" />
        </linearGradient>
        {/* HALO / DROP SHADOW: stopColor sets colour; stopOpacity sets strength.
            offset positions the glow within its radius-59 circle below. */}
        <radialGradient id={haloId}>
          <stop offset=".50" stopColor="var(--luna-accent-blue)" stopOpacity="0" />
          <stop offset=".82" stopColor="var(--luna-accent-primary)" stopOpacity={size === "sm" ? ".18" : ".3"} />
          <stop offset="1" stopColor="var(--luna-accent-blue)" stopOpacity="0" />
        </radialGradient>
        {/* FIRST DOT GLOW: bright centre fading into violet. */}
        <radialGradient id={pinkDotId}>
          <stop stopColor="var(--luna-text-primary)" stopOpacity=".95" />
          <stop offset=".25" stopColor="var(--luna-accent-light)" stopOpacity=".45" />
          <stop offset="1" stopColor="var(--luna-accent-primary)" stopOpacity="0" />
        </radialGradient>
        {/* OTHER TWO DOT GLOWS: bright centres fading into blue. */}
        <radialGradient id={blueDotId}>
          <stop stopColor="var(--luna-text-primary)" stopOpacity=".95" />
          <stop offset=".25" stopColor="var(--luna-accent-blue)" stopOpacity=".45" />
          <stop offset="1" stopColor="var(--luna-accent-blue)" stopOpacity="0" />
        </radialGradient>
        {/* Define the lit phase; mirror it for waning phases. */}
        <clipPath id={clipId}>
          {illumination === 100 ? <circle cx="50" cy="50" r="44" /> :
            illumination > 0 ? <path d={path} transform={waning ? "translate(100 0) scale(-1 1)" : undefined} /> : null}
        </clipPath>
        {/* Keep the outer Moon edge crisp while its internal shadow fades. */}
        <clipPath id={discClipId}>
          <circle cx="50" cy="50" r="44" />
        </clipPath>
        {/* SHADOW SOFTNESS: soften only the shadow boundary, keeping the surface
            sharp. SVG units scale the fade with every Moon size. */}
        <filter id={shadowBlurId} filterUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        {/* White keeps the dark side; black removes the current illuminated phase.
            The existing phase clip handles crescents, quarters and gibbous phases. */}
        <mask id={shadowMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" style={{ maskType: "luminance" }}>
          <rect width="100" height="100" fill="white" />
          <rect width="100" height="100" fill="black" clipPath={`url(#${clipId})`} />
        </mask>
      </defs>
      <g aria-hidden="true">
        {glow ? (
          <g>
            {/* HALO SIZE: r controls how far the soft glow extends from (50, 50). */}
            <circle cx="50" cy="50" r="59" fill={`url(#${haloId})`} />
            {showOrbit ? <>
            {/* ORBIT GAP: ring radius 56 minus Moon radius 44 = 12 SVG units.
                Change strokeWidth / strokeOpacity for ring thickness / visibility. */}
            <circle cx="50" cy="50" r="56" fill="none" stroke={`url(#${rimId})`} strokeOpacity=".85" strokeWidth=".35" />
            {/* MOTION: src/app/globals.css controls .moon-orbit-dots and @keyframes
                moon-orbit: 28s linear infinite. Larger duration = slower rotation.
                Its no-preference media query keeps dots still for reduced motion. */}
            <g className="moon-orbit-dots">
              {/* Invisible symmetric bounds keep CSS rotation centred on the Moon.
                  Keep this radius large enough to contain all moving dot glows. */}
              <circle cx="50" cy="50" r="60" fill="none" />
              {/* DOT SPACING: three angles 120 degrees apart keep spacing even. */}
              {[0, 120, 240].map((angle, index) => (
                <g key={angle} transform={`rotate(${angle} 50 50)`}>
                  {/* DOT ALIGNMENT: cy = 50 - orbit radius (56), so both use -6.
                      If the ring radius changes, update BOTH cy values together.
                      r=3.8 sets the soft glow size; r=.65 sets the bright core size. */}
                  <circle cx="50" cy="-6" r="3.8" fill={`url(#${index === 0 ? pinkDotId : blueDotId})`} />
                  <circle cx="50" cy="-6" r=".65" fill="var(--luna-text-primary)" />
                </g>
              ))}
            </g>
            </> : null}
          </g>
        ) : null}
        {/* DARK SIDE: base disc remains visible behind the illuminated phase. */}
        <circle cx="50" cy="50" r="44" fill="var(--luna-surface-elevated)" />
        <g clipPath={`url(#${discClipId})`}>
          {/* Shared Moon texture scales with the SVG inside its smooth circular clip. */}
          {surfaceImageSrc ? (
            <image href={surfaceImageSrc} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" />
          ) : <>
          {/* LIT SIDE: render the surface and craters sharply, without a filter. */}
          <circle cx="50" cy="50" r="44" fill={`url(#${surfaceId})`} />
          {/* Calendar-size Moons show fewer craters to keep the small visual clear. */}
          {craters.slice(0, size === "xs" ? 4 : craters.length).map(([cx, cy, rx, ry]) => (
            <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry}
              fill="var(--luna-surface-strong)" fillOpacity=".23"
              stroke="var(--luna-text-primary)" strokeOpacity=".15" strokeWidth=".45" />
          ))}
          {/* Small surface highlights appear only on medium and larger Moons. */}
          {size !== "xs" && size !== "sm" ? (
            <g fill="var(--luna-text-primary)" opacity=".3">
              <circle cx="55" cy="57" r="2.3" /><circle cx="31" cy="69" r="1.7" />
              <circle cx="77" cy="33" r="1.2" /><circle cx="45" cy="19" r="1" />
            </g>
          ) : null}
          </>}
          {/* DARK SIDE: near-black shading leaves a faint trace of surface detail.
              A new Moon stays fully dark; a full Moon has no overlay.
              The disc clip keeps the outer edge clean as the shadow fades. */}
          {illumination === 0 ? (
            <circle cx="50" cy="50" r="44" fill="black" />
          ) : illumination < 100 ? (
            <g filter={`url(#${shadowBlurId})`}>
              <rect width="100" height="100" fill="black" fillOpacity=".97" mask={`url(#${shadowMaskId})`} />
            </g>
          ) : null}
        </g>
        {/* MOON OUTLINE: strokeWidth controls the thin edge around the Moon itself. */}
        <circle cx="50" cy="50" r="44" fill="none" stroke={`url(#${rimId})`} strokeWidth="0" />
      </g>
    </svg>
  );
}
