// @vitest-environment jsdom
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MoonVisualProps } from "@/components/moon/MoonVisual";
import { getMoonData } from "@/lib/astronomy/moon";
import { formatLocalDate } from "@/lib/dates/local-date";
import type { LocalDate, MoonData } from "@/types/moon";
import { LunarCalendar } from "./LunarCalendar";

function createMockMoonData(date: LocalDate): MoonData {
  const illuminationPercentage = (date.day * 3) % 100 + 0.25;
  return {
    phaseName: date.day % 2 === 0 ? "Waxing Crescent" : "Waning Gibbous",
    phaseFraction: illuminationPercentage / 100,
    illuminationPercentage,
    moonAgeDays: date.day / 2 + 0.05,
    previousMajorPhase: {
      name: "New Moon",
      date: { year: date.year, month: date.month, day: 1 },
    },
    nextMajorPhase: {
      name: "Full Moon",
      date: { year: date.year, month: date.month, day: Math.min(28, Math.max(2, date.day)) },
    },
  };
}

vi.mock("@/lib/astronomy/moon", () => {
  return { getMoonData: vi.fn(createMockMoonData) };
});

vi.mock("@/components/moon/MoonVisual", async () => {
  const { createElement: createMockElement } = await import("react");

  return {
    MoonVisual: (props: MoonVisualProps) => {
      const phase = props.moon?.phaseName ?? props.phase;
      const illumination = props.moon?.illuminationPercentage ?? props.illumination;

      return createMockElement("svg", {
        "aria-hidden": props.decorative ? "true" : undefined,
        className: props.className,
        "data-decorative": String(props.decorative ?? false),
        "data-illumination": illumination,
        "data-phase": phase,
        "data-show-glow": String(props.showGlow ?? true),
        "data-size": props.size ?? "lg",
        focusable: "false",
      });
    },
  };
});

const fixedDate = { year: 2026, month: 9, day: 18 } as const;

function getCalendarTable(): HTMLTableElement {
  const table = document.querySelector("table");
  if (!(table instanceof HTMLTableElement)) {
    throw new Error("Expected one rendered lunar-calendar table.");
  }
  return table;
}

function getDateButton(label: string): HTMLButtonElement {
  const matches = getGridButtons().filter((button) => (
    button.getAttribute("aria-label")?.includes(label)
  ));
  if (matches.length !== 1) {
    throw new Error(`Expected one date button with an aria-label containing "${label}", found ${matches.length}.`);
  }
  return matches[0];
}

function getGridButtons(): HTMLButtonElement[] {
  const buttons = Array.from(getCalendarTable().querySelectorAll<HTMLButtonElement>("tbody button"));
  if (buttons.length === 0) {
    throw new Error("Expected rendered date buttons inside the lunar-calendar table body.");
  }
  return buttons;
}

function getNavigationButton(label: string): HTMLButtonElement {
  const matches = Array.from(document.querySelectorAll<HTMLButtonElement>("header button")).filter(
    (button) => button.getAttribute("aria-label") === label,
  );
  if (matches.length !== 1) {
    throw new Error(`Expected one calendar navigation button labelled "${label}", found ${matches.length}.`);
  }
  return matches[0];
}

function expectMonthHeading(label: string) {
  const heading = document.querySelector("section h2");
  if (!(heading instanceof HTMLHeadingElement)) {
    throw new Error("Expected the calendar month to use a level-two heading.");
  }
  expect(heading.textContent).toBe(label);
}

function expectOneRovingTabStop(expected?: HTMLButtonElement) {
  const tabStops = getGridButtons().filter((button) => button.tabIndex === 0);
  expect(tabStops).toHaveLength(1);
  if (expected) expect(tabStops[0]).toBe(expected);
}

function getSelectedDetails(): HTMLElement {
  const details = document.querySelector("aside");
  if (!(details instanceof HTMLElement)) {
    throw new Error("Expected a selected-date details aside.");
  }
  return details;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 18, 12));
  vi.mocked(getMoonData).mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("interactive lunar calendar structure and data", () => {
  it("renders the month heading, Monday-first headers, complete 35 and 42 cell grids", () => {
    const { container, unmount } = render(<LunarCalendar initialDate={fixedDate} />);
    expectMonthHeading("September 2026");
    const semanticTable = screen.getByRole("table", {
      name: "September 2026 lunar calendar, Monday through Sunday.",
    });
    expect(semanticTable).toBe(getCalendarTable());
    const headers = Array.from(semanticTable.querySelectorAll<HTMLTableCellElement>("th[scope='col']"));
    const weekdays = [
      ["Mon", "Monday"], ["Tue", "Tuesday"], ["Wed", "Wednesday"], ["Thu", "Thursday"],
      ["Fri", "Friday"], ["Sat", "Saturday"], ["Sun", "Sunday"],
    ] as const;
    expect(headers).toHaveLength(weekdays.length);
    for (const [index, [short, long]] of weekdays.entries()) {
      expect(headers[index].querySelector("[aria-hidden='true']")?.textContent).toBe(short);
      expect(headers[index].querySelector(".sr-only")?.textContent).toBe(long);
    }
    expect(container.querySelectorAll("tbody td")).toHaveLength(35);
    expect(getDateButton("Monday, August 31, 2026").textContent).toContain("Aug");
    expect(getDateButton("Sunday, October 4, 2026").getAttribute("aria-label")).toContain("outside the displayed month");
    unmount();

    const second = render(<LunarCalendar initialDate={{ year: 2024, month: 9, day: 13 }} />);
    expect(second.container.querySelectorAll("tbody td")).toHaveLength(42);
  });

  it("uses one precomputed astronomy result and one decorative MoonVisual per visible date", () => {
    const { container } = render(<LunarCalendar initialDate={fixedDate} />);
    const cells = container.querySelectorAll("tbody td");
    const moons = container.querySelectorAll("tbody svg[data-size='xs']");
    expect(cells).toHaveLength(35);
    expect(moons).toHaveLength(cells.length);
    expect(vi.mocked(getMoonData)).toHaveBeenCalledTimes(cells.length);
    const calculatedDates = vi.mocked(getMoonData).mock.calls.map(([date]) => (
      `${date.year}-${date.month}-${date.day}`
    ));
    expect(new Set(calculatedDates).size).toBe(cells.length);

    const moon = createMockMoonData(fixedDate);
    const todayVisual = getDateButton("Friday, September 18, 2026").querySelector("svg");
    expect(todayVisual?.getAttribute("data-phase")).toBe(moon.phaseName);
    expect(todayVisual?.getAttribute("data-illumination")).toBe(String(moon.illuminationPercentage));
    expect(todayVisual?.getAttribute("data-size")).toBe("xs");
    expect(todayVisual?.getAttribute("data-decorative")).toBe("true");
    expect(todayVisual?.getAttribute("aria-hidden")).toBe("true");

    fireEvent.click(getNavigationButton("Show next month"));
    const callsAfterMonthChange = vi.mocked(getMoonData).mock.calls.length;
    expect(callsAfterMonthChange).toBe(35 + container.querySelectorAll("tbody td").length + 1);
    const focused = getGridButtons().find((button) => button.tabIndex === 0) as HTMLButtonElement;
    focused.focus();
    fireEvent.keyDown(focused, { key: "ArrowRight" });
    expect(vi.mocked(getMoonData)).toHaveBeenCalledTimes(callsAfterMonthChange);
  });

  it("exposes accessible navigation, date labels, today and one roving tab stop", () => {
    render(<LunarCalendar initialDate={fixedDate} />);
    const previous = getNavigationButton("Show previous month");
    const next = getNavigationButton("Show next month");
    expect(previous.tagName).toBe("BUTTON");
    expect(previous.getAttribute("aria-label")).toBe("Show previous month");
    expect(next.tagName).toBe("BUTTON");
    expect(next.getAttribute("aria-label")).toBe("Show next month");
    const moon = getMoonData(fixedDate);
    const today = getDateButton("Friday, September 18, 2026");
    for (const control of [previous, next, today]) {
      expect(control.className).toContain("focus-visible:outline-solid!");
    }
    expect(today.getAttribute("aria-label")).toContain(moon.phaseName);
    expect(today.getAttribute("aria-label")).toContain(`${Math.round(moon.illuminationPercentage)}% illuminated`);
    expect(today.getAttribute("aria-current")).toBe("date");
    expect(today.getAttribute("aria-pressed")).toBe("true");
    expectOneRovingTabStop(today);
  });

  it("renders complete selected-date details with unchanged astronomy values", () => {
    const { container } = render(<LunarCalendar initialDate={fixedDate} />);
    const moon = getMoonData(fixedDate);
    const details = getSelectedDetails();
    const detailsHeading = details.querySelector("h3");
    expect(detailsHeading?.textContent).toBe(moon.phaseName);
    expect(details.getAttribute("aria-labelledby")).toBe(detailsHeading?.id);
    expect(details.querySelector('time[datetime="2026-09-18"]')).toBeTruthy();
    expect(details.textContent).toContain(`${Math.round(moon.illuminationPercentage)}%`);
    expect(details.textContent).toContain(`${moon.moonAgeDays.toFixed(1)} days`);
    expect(details.textContent).toContain(moon.previousMajorPhase.name);
    expect(details.textContent).toContain(formatLocalDate(moon.previousMajorPhase.date, { month: "short", day: "numeric", year: "numeric" }));
    expect(details.textContent).toContain(moon.nextMajorPhase.name);
    expect(details.textContent).toContain(formatLocalDate(moon.nextMajorPhase.date, { month: "short", day: "numeric", year: "numeric" }));
    const detailMoon = container.querySelector("aside svg");
    expect(detailMoon?.getAttribute("data-phase")).toBe(moon.phaseName);
    expect(detailMoon?.getAttribute("data-illumination")).toBe(String(moon.illuminationPercentage));
    expect(detailMoon?.getAttribute("data-size")).toBe("md");
    expect(detailMoon?.getAttribute("data-decorative")).toBe("true");
    expect(detailMoon?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("month navigation and selection", () => {
  it("moves backward and forward while preserving the selected date and header focus", () => {
    render(<LunarCalendar initialDate={{ year: 2026, month: 1, day: 31 }} />);
    const next = getNavigationButton("Show next month");
    next.focus();
    fireEvent.click(next);
    expectMonthHeading("February 2026");
    expect(document.activeElement).toBe(next);
    expectOneRovingTabStop(getDateButton("Saturday, February 28, 2026"));
    expect(getSelectedDetails().querySelector('time[datetime="2026-01-31"]')).toBeTruthy();

    const previous = getNavigationButton("Show previous month");
    previous.focus();
    fireEvent.click(previous);
    expectMonthHeading("January 2026");
    expect(document.activeElement).toBe(previous);
    expectOneRovingTabStop(getDateButton("Wednesday, January 28, 2026"));
    expect(getSelectedDetails().querySelector('time[datetime="2026-01-31"]')).toBeTruthy();
  });

  it.each([
    [{ year: 2026, month: 12, day: 15 }, "Show next month", "January 2027"],
    [{ year: 2026, month: 1, day: 15 }, "Show previous month", "December 2025"],
  ] as const)("crosses year boundaries from %j", (initialDate, navigationName, heading) => {
    render(<LunarCalendar initialDate={initialDate} />);
    fireEvent.click(getNavigationButton(navigationName));
    expectMonthHeading(heading);
    expectOneRovingTabStop();
  });

  it("selects with pointer, Enter and Space without moving focus into details", () => {
    render(<LunarCalendar initialDate={fixedDate} />);
    const pointerTarget = getDateButton("Wednesday, September 23, 2026");
    fireEvent.click(pointerTarget);
    expect(pointerTarget.getAttribute("aria-pressed")).toBe("true");
    expect(getSelectedDetails().querySelector('time[datetime="2026-09-23"]')).toBeTruthy();

    const enterTarget = getDateButton("Thursday, September 24, 2026");
    enterTarget.focus();
    fireEvent.keyDown(enterTarget, { key: "Enter" });
    expect(enterTarget.getAttribute("aria-pressed")).toBe("true");
    expect(document.activeElement).toBe(enterTarget);

    const spaceTarget = getDateButton("Friday, September 25, 2026");
    spaceTarget.focus();
    fireEvent.keyDown(spaceTarget, { key: " " });
    expect(spaceTarget.getAttribute("aria-pressed")).toBe("true");
    expect(document.activeElement).toBe(spaceTarget);
    expect(getSelectedDetails().querySelector('time[datetime="2026-09-25"]')).toBeTruthy();
  });

  it("activates an adjacent-month date, changes the displayed month and restores button focus", () => {
    render(<LunarCalendar initialDate={fixedDate} />);
    const adjacent = getDateButton("Monday, August 31, 2026");
    adjacent.focus();
    fireEvent.click(adjacent);

    expectMonthHeading("August 2026");
    const selected = getDateButton("Monday, August 31, 2026");
    expect(selected.getAttribute("aria-pressed")).toBe("true");
    expect(document.activeElement).toBe(selected);
    expectOneRovingTabStop(selected);
    expect(getSelectedDetails().querySelector('time[datetime="2026-08-31"]')).toBeTruthy();
  });
});

describe("calendar keyboard navigation", () => {
  it("moves by one day and one week without changing selection", () => {
    render(<LunarCalendar initialDate={{ year: 2026, month: 9, day: 17 }} />);
    const initial = getDateButton("Thursday, September 17, 2026");
    initial.focus();
    fireEvent.keyDown(initial, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(getDateButton("Wednesday, September 16, 2026"));
    expect(getDateButton("Thursday, September 17, 2026").getAttribute("aria-pressed")).toBe("true");

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowUp" });
    expect(document.activeElement).toBe(getDateButton("Wednesday, September 9, 2026"));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(getDateButton("Wednesday, September 16, 2026"));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(getDateButton("Thursday, September 17, 2026"));
    expectOneRovingTabStop(document.activeElement as HTMLButtonElement);
  });

  it("moves Home and End to Monday and Sunday boundaries of the current row", () => {
    render(<LunarCalendar initialDate={{ year: 2026, month: 9, day: 17 }} />);
    const initial = getDateButton("Thursday, September 17, 2026");
    initial.focus();
    fireEvent.keyDown(initial, { key: "Home" });
    expect(document.activeElement).toBe(getDateButton("Monday, September 14, 2026"));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "End" });
    expect(document.activeElement).toBe(getDateButton("Sunday, September 20, 2026"));
    expect(getDateButton("Thursday, September 17, 2026").getAttribute("aria-pressed")).toBe("true");
  });

  it("clamps Page Up and Page Down month movement and preserves selection", () => {
    render(<LunarCalendar initialDate={{ year: 2026, month: 3, day: 31 }} />);
    const initial = getDateButton("Tuesday, March 31, 2026");
    initial.focus();
    fireEvent.keyDown(initial, { key: "PageUp" });
    expectMonthHeading("February 2026");
    expect(document.activeElement).toBe(getDateButton("Saturday, February 28, 2026"));
    expect(getSelectedDetails().querySelector('time[datetime="2026-03-31"]')).toBeTruthy();

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "PageDown" });
    expectMonthHeading("March 2026");
    expect(document.activeElement).toBe(getDateButton("Saturday, March 28, 2026"));
    expectOneRovingTabStop(document.activeElement as HTMLButtonElement);
  });

  it.each([
    [{ year: 2026, month: 1, day: 31 }, "PageUp", "Wednesday, December 31, 2025", "December 2025"],
    [{ year: 2026, month: 12, day: 31 }, "PageDown", "Sunday, January 31, 2027", "January 2027"],
  ] as const)("supports %s across a year boundary", (initialDate, key, targetLabel, heading) => {
    render(<LunarCalendar initialDate={initialDate} />);
    const initial = getGridButtons().find((button) => button.tabIndex === 0);
    initial?.focus();
    fireEvent.keyDown(initial as HTMLButtonElement, { key });
    expectMonthHeading(heading);
    expect(document.activeElement).toBe(getDateButton(targetLabel));
    expectOneRovingTabStop(document.activeElement as HTMLButtonElement);
  });

  it("updates the visible month and active element when an arrow crosses a boundary", () => {
    render(<LunarCalendar initialDate={{ year: 2026, month: 9, day: 1 }} />);
    const initial = getDateButton("Tuesday, September 1, 2026");
    initial.focus();
    fireEvent.keyDown(initial, { key: "ArrowLeft" });
    expectMonthHeading("August 2026");
    const target = getDateButton("Monday, August 31, 2026");
    expect(document.activeElement).toBe(target);
    expect(target.getAttribute("aria-pressed")).toBe("false");
    expect(getSelectedDetails().querySelector('time[datetime="2026-09-01"]')).toBeTruthy();
    expectOneRovingTabStop(target);
  });
});

describe("deterministic initialization", () => {
  it("does not mutate a frozen injected date", () => {
    const initialDate = Object.freeze<LocalDate>({ year: 2026, month: 9, day: 18 });
    render(<LunarCalendar initialDate={initialDate} />);
    fireEvent.click(getNavigationButton("Show next month"));
    expect(initialDate).toEqual(fixedDate);
  });

  it("renders a truthful stable server placeholder until the visitor-local date resolves", () => {
    const first = renderToString(createElement(LunarCalendar));
    vi.setSystemTime(new Date(2031, 4, 7, 23, 59));
    const second = renderToString(createElement(LunarCalendar));
    expect(second).toBe(first);
    expect(first).toContain('role="status"');
    expect(first).toContain("Preparing your local lunar calendar");
    expect(first).not.toContain("<table");
    expect(first).not.toContain("<svg");
    expect(first).not.toContain("<time");
  });
});
