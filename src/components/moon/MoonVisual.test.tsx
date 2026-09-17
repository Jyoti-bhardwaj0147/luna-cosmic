import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MOON_PHASE_NAMES } from "@/constants/phases";
import { MoonVisual, type MoonVisualProps, type MoonVisualSize } from "./MoonVisual";
import type { MoonData } from "@/types/moon";

const render = (props: MoonVisualProps) => renderToStaticMarkup(createElement(MoonVisual, props));

describe("MoonVisual public rendering contract", () => {
  it.each(MOON_PHASE_NAMES)("renders canonical phase %s accessibly", phase => {
    const html = render({ phase, illumination: 50 });
    expect(html).toContain(`data-phase="${phase}"`);
    expect(html).toContain('role="img"');
    expect(html).toContain("50 percent illuminated");
  });

  it("mirrors the illuminated silhouette for waning, not its surface texture", () => {
    const waxing = render({ phase: "Waxing Crescent", illumination: 25 });
    const waning = render({ phase: "Waning Crescent", illumination: 25 });
    expect(waxing).toContain('data-orientation="right"');
    expect(waning).toContain('data-orientation="left"');
    expect(waxing).not.toContain("scale(-1 1)");
    expect(waning).toContain('transform="translate(100 0) scale(-1 1)"');
  });

  it("uses curved terminators for crescents/gibbous and a straight quarter", () => {
    for (const illumination of [25, 75]) {
      const html = render({ phase: "Waxing Crescent", illumination });
      const path = html.match(/<path d="([^"]+)"/)?.[1] || "";
      expect(path.split("A ").length - 1).toBe(2);
    }
    expect(render({ phase: "First Quarter", illumination: 50 })).toContain("L 50 6");
    expect(render({ phase: "Last Quarter", illumination: 50 })).toContain('data-orientation="left"');
  });

  it.each([[-4, 0], [140, 100], [NaN, 0], [Infinity, 0], [-Infinity, 0]])(
    "normalizes %s to %s at the presentation boundary", (input, output) => {
      const html = render({ phase: "Full Moon", illumination: input });
      expect(html).toContain(`data-illumination="${output}"`);
      expect(html).toContain(`${output} percent illuminated`);
      expect(html).not.toContain("NaN");
    },
  );

  it("keeps new dark and full lit without degenerate paths", () => {
    const dark = render({ phase: "New Moon", illumination: 0 });
    const full = render({ phase: "Full Moon", illumination: 100 });
    expect(dark).toMatch(/<clipPath[^>]+><\/clipPath>/);
    expect(full).toMatch(/<clipPath[^>]+><circle/);
    expect(dark).toMatch(/stroke="url\(#moon-rim-/);
    expect(full).toContain("<ellipse");
  });

  it.each<MoonVisualSize>(["xs", "sm", "md", "lg", "xl"])("supports size %s and className", size => {
    const html = render({ phase: "Full Moon", illumination: 100, size, className: "test-class" });
    expect(html).toContain(`data-size="${size}"`);
    expect(html).toContain("test-class");
    expect(html).toContain("max-width:100%");
  });

  it("hides decorative content and supports custom meaningful labels", () => {
    const decorative = render({ phase: "New Moon", illumination: 0, decorative: true, label: "Ignore me" });
    expect(decorative).toContain('aria-hidden="true"');
    expect(decorative).not.toContain('role="img"');
    expect(decorative).not.toContain("aria-label");
    expect(decorative).toContain('focusable="false"');
    expect(render({ phase: "New Moon", illumination: 0, label: "Custom moon" })).toContain('aria-label="Custom moon"');
    expect(render({ phase: "Waxing Gibbous", illumination: 78 })).toContain('aria-label="Waxing Gibbous Moon, 78 percent illuminated"');
  });

  it("omits glow when disabled and at calendar size", () => {
    expect(render({ phase: "Full Moon", illumination: 100, showGlow: false })).toContain('data-glow="false"');
    expect(render({ phase: "Full Moon", illumination: 100, size: "xs", showGlow: true })).toContain('data-glow="false"');
    expect(render({ phase: "Full Moon", illumination: 100 })).toContain('data-glow="true"');
  });

  it("is deterministic and does not mutate input props", () => {
    const props = Object.freeze({ phase: "Waxing Gibbous" as const, illumination: 78 });
    expect(render(props)).toBe(render(props));
    expect(props).toEqual({ phase: "Waxing Gibbous", illumination: 78 });
  });

  it("assigns distinct definition IDs to sibling instances", () => {
    const props = { phase: "Full Moon" as const, illumination: 100 };
    const html = renderToStaticMarkup(createElement("div", null, createElement(MoonVisual, props), createElement(MoonVisual, props)));
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("preserves the legacy moon API without mutating astronomy data", () => {
    const moon: MoonData = Object.freeze<MoonData>({
      phaseName: "Waning Gibbous", phaseFraction: 0.6, illuminationPercentage: 81,
      moonAgeDays: 18, previousMajorPhase: { name: "Full Moon", date: { year: 2026, month: 1, day: 3 } },
      nextMajorPhase: { name: "Last Quarter", date: { year: 2026, month: 1, day: 10 } },
    });
    expect(render({ moon })).toContain('data-orientation="left"');
    expect(moon.illuminationPercentage).toBe(81);
  });
});
