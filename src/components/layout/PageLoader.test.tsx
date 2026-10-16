// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageLoader } from "./PageLoader";

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
  document.body.style.overflow = "auto";
  const content = document.createElement("main");
  content.id = "luna-page-content";
  document.body.append(content);
});

afterEach(() => {
  cleanup();
  document.getElementById("luna-page-content")?.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("PageLoader", () => {
  it("releases the page after the deadline when loading stalls", async () => {
    render(createElement(PageLoader));
    expect(document.getElementById("luna-page-content")?.inert).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    await act(async () => { await vi.advanceTimersByTimeAsync(8000); });
    expect(screen.getByRole("status").getAttribute("data-leaving")).toBe("true");
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.getElementById("luna-page-content")?.inert).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("waits for fonts before fading out", async () => {
    let resolveFonts!: () => void;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(0), 16));
    const ready = new Promise<void>((resolve) => { resolveFonts = resolve; });
    Object.defineProperty(document, "fonts", { configurable: true, value: { ready } });
    render(createElement(PageLoader));
    window.dispatchEvent(new Event("load"));
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByRole("status").getAttribute("data-leaving")).toBe("false");
    await act(async () => { resolveFonts(); });
    expect(screen.getByRole("status").getAttribute("data-leaving")).toBe("true");
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    expect(screen.queryByRole("status")).toBeNull();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, "fonts");
  });

  it("restores scrolling and interaction when unmounted during loading", () => {
    const { unmount } = render(createElement(PageLoader));
    unmount();
    expect(document.body.style.overflow).toBe("auto");
    expect(document.getElementById("luna-page-content")?.inert).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
