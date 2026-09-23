// @vitest-environment jsdom
import { act, createElement } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOON_PHASE_NAMES } from "@/constants/phases";
import { getMoonData } from "@/lib/astronomy/moon";
import { localDateToUtcNoon } from "@/lib/dates/local-date";
import { HomeExperience } from "@/components/HomeExperience";
import { TodayMoon } from "./TodayMoon";
import { TodayMoonContent } from "./TodayMoonContent";
import { createTodayMoonViewModel, PHASE_DESCRIPTIONS } from "./today-moon";

const fixedDate = { year: 2026, month: 9, day: 18 };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 18, 0, 30));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Today's Moon presentation", () => {
  it("preserves astronomy values and rounds only display labels", () => {
    const date = Object.freeze({ ...fixedDate });
    const model = createTodayMoonViewModel(date);
    expect(model.moon).toEqual(getMoonData(date));
    expect(model.illuminationLabel).toBe(`${Math.round(model.moon.illuminationPercentage)}%`);
    expect(model.ageLabel).toBe(`${model.moon.moonAgeDays.toFixed(1)} days`);
    expect(model.dateLabel).toBe("Friday, September 18, 2026");
    expect(date).toEqual(fixedDate);
    expect(createTodayMoonViewModel(date)).toEqual(model);
  });

  it.each(MOON_PHASE_NAMES)("provides an informational description for %s", phase => {
    expect(PHASE_DESCRIPTIONS[phase].length).toBeGreaterThan(30);
    expect(PHASE_DESCRIPTIONS[phase]).toMatch(/increas|decreas|grows/);
  });

  it("renders the full data set, semantic statistics and unrounded decorative visual", () => {
    const model = createTodayMoonViewModel(fixedDate);
    const { container } = render(createElement(TodayMoonContent, { model }));
    const region = screen.getByRole("region", { name: model.moon.phaseName });
    expect(within(region).getByRole("heading", { level: 2 }).textContent).toBe(model.moon.phaseName);
    for (const label of [model.dateLabel, model.description, model.illuminationLabel, model.ageLabel,
      model.countdownLabel]) {
      expect(within(region).getByText(label)).toBeTruthy();
    }
    expect(within(region).getByText(`${model.previousPhaseDateLabel} (UTC)`)).toBeTruthy();
    expect(within(region).getByText(`${model.nextPhaseDateLabel} (UTC)`)).toBeTruthy();
    expect(within(region).getByText(model.moon.previousMajorPhase.name, { selector: "dd" })).toBeTruthy();
    expect(within(region).getByText(model.moon.nextMajorPhase.name, { selector: "dd" })).toBeTruthy();
    expect(container.querySelectorAll("dl dt")).toHaveLength(5);
    expect(container.querySelectorAll("dl dd")).toHaveLength(5);
    const moon = container.querySelector("svg");
    expect(moon?.getAttribute("data-phase")).toBe(model.moon.phaseName);
    expect(moon?.getAttribute("data-illumination")).toBe(String(model.moon.illuminationPercentage));
    expect(moon?.getAttribute("aria-hidden")).toBe("true");
    expect(moon?.getAttribute("focusable")).toBe("false");
    expect(container.querySelector("time")?.getAttribute("datetime")).toBe("2026-09-18");
  });

  it("uses calendar-day estimates without negatives, including a same-date next phase", () => {
    let sawSameDate = false;
    for (let day = 1; day <= 30; day++) {
      const model = createTodayMoonViewModel({ year: 2026, month: 9, day });
      const difference = (localDateToUtcNoon(model.moon.nextMajorPhase.date).getTime() -
        localDateToUtcNoon(model.date).getTime()) / 86_400_000;
      expect(model.daysUntilNextPhase).toBe(Math.max(0, difference));
      expect(model.daysUntilNextPhase).toBeGreaterThanOrEqual(0);
      if (difference === 0) {
        sawSameDate = true;
        expect(model.countdownLabel).toBe("Same calendar date");
      }
    }
    expect(sawSameDate).toBe(true);
  });
});

describe("visitor-local date and hydration", () => {
  it("keeps server markup stable without a date, a phase or a false Moon", () => {
    const first = renderToString(createElement(TodayMoon));
    vi.setSystemTime(new Date(2030, 1, 7, 23, 59));
    expect(renderToString(createElement(TodayMoon))).toBe(first);
    expect(first).toContain('role="status"');
    expect(first).not.toContain("<time");
    expect(first).not.toContain("<svg");
    expect(first).not.toContain("2026");
    for (const phase of MOON_PHASE_NAMES) expect(first).not.toContain(phase);
  });

  it("uses local date fields after hydration even when UTC has a different date", async () => {
    // Controlled browser-local fields simulate the civil date in a timezone
    // behind UTC. UTC methods remain untouched for the astronomy wrapper.
    vi.setSystemTime(new Date("2026-09-19T02:30:00Z"));
    vi.spyOn(Date.prototype, "getFullYear").mockReturnValue(2026);
    vi.spyOn(Date.prototype, "getMonth").mockReturnValue(8);
    vi.spyOn(Date.prototype, "getDate").mockReturnValue(18);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = renderToString(createElement(TodayMoon));
    expect(container.querySelector("time")).toBeNull();
    const errors: unknown[] = [];
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, createElement(TodayMoon), {
          onRecoverableError: error => errors.push(error),
        });
      });
      const model = createTodayMoonViewModel(fixedDate);
      expect(container.querySelector("time")?.getAttribute("datetime")).toBe("2026-09-18");
      expect(container.querySelector("h2")?.textContent).toBe(model.moon.phaseName);
      expect(container.querySelector("svg")?.getAttribute("data-illumination")).toBe(String(model.moon.illuminationPercentage));
      expect(errors).toEqual([]);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });

  it("keeps the homepage stable during hydration when the local date differs from server time", async () => {
    vi.setSystemTime(new Date("2026-09-19T02:30:00Z"));
    vi.spyOn(Date.prototype, "getFullYear").mockReturnValue(2026);
    vi.spyOn(Date.prototype, "getMonth").mockReturnValue(8);
    vi.spyOn(Date.prototype, "getDate").mockReturnValue(18);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

    const serverMarkup = renderToString(createElement(HomeExperience));
    expect(serverMarkup).toContain("Your local calendar date");

    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = serverMarkup;

    const errors: unknown[] = [];
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, createElement(HomeExperience), {
          onRecoverableError: error => errors.push(error),
        });
      });
      expect(errors).toEqual([]);
      expect(container.querySelector("time")?.getAttribute("datetime")).toBe("2026-09-18");
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});
