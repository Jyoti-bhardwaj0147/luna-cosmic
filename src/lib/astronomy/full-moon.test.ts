import { describe, expect, it } from "vitest";
import { getDaysUntilFullMoon } from "./phases";

describe("getDaysUntilFullMoon", () => {
  it("counts calendar days to the March 2024 full moon", () => {
    expect(getDaysUntilFullMoon({ year: 2024, month: 3, day: 24 })).toBe(1);
  });

  it("includes the full moon date even when the event is before noon", () => {
    expect(getDaysUntilFullMoon({ year: 2024, month: 3, day: 25 })).toBe(0);
  });

  it("finds the following full moon after the full moon date", () => {
    expect(getDaysUntilFullMoon({ year: 2024, month: 3, day: 26 })).toBe(28);
  });

  it("rejects invalid dates", () => {
    expect(() => getDaysUntilFullMoon({ year: 2024, month: 2, day: 30 })).toThrow(RangeError);
  });
});
