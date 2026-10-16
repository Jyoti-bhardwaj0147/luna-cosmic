"use client";

import { useEffect, useState } from "react";

export function PageLoader() {
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading");

  useEffect(() => {
    const content = document.getElementById("luna-page-content");
    const previousOverflow = document.body.style.overflow;
    const previousInert = content?.inert ?? false;
    document.body.style.overflow = "hidden";
    if (content) content.inert = true;

    let cancelled = false;
    let finishing = false;
    let frame = 0;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;

    function restorePage() {
      document.body.style.overflow = previousOverflow;
      if (content) content.inert = previousInert;
    }

    function finish() {
      if (cancelled || finishing) return;
      finishing = true;
      setPhase("leaving");
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      fadeTimer = setTimeout(() => {
        restorePage();
        setPhase("done");
      }, reducedMotion ? 0 : 350);
    }

    async function waitForVisibleAssets() {
      if (cancelled) return;
      const sources = new Set<string>();
      content?.querySelectorAll<HTMLElement | SVGElement>("*").forEach((element) => {
        const bounds = element.getBoundingClientRect();
        if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
        if (element instanceof HTMLImageElement) {
          if (element.currentSrc || element.src) sources.add(element.currentSrc || element.src);
        } else if (element.tagName.toLowerCase() === "image") {
          const href = element.getAttribute("href");
          if (href) sources.add(href);
        }
        for (const match of getComputedStyle(element).backgroundImage.matchAll(/url\(["']?(.*?)["']?\)/g)) {
          sources.add(match[1]);
        }
      });
      await Promise.allSettled([
        document.fonts?.ready,
        ...Array.from(sources, (source) => {
          const image = new Image();
          image.src = source;
          return image.decode();
        }),
      ]);
      finish();
    }

    function onLoad() {
      // Allow local-date hydration to replace the initial placeholder first.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => { void waitForVisibleAssets(); });
      });
    }

    const deadline = setTimeout(finish, 8000);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      cancelled = true;
      clearTimeout(deadline);
      clearTimeout(fadeTimer);
      cancelAnimationFrame(frame);
      window.removeEventListener("load", onLoad);
      restorePage();
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div className="luna-page-loader" data-leaving={phase === "leaving"} role="status" aria-label="Loading Luna">
      <div className="moon__loader" aria-hidden="true" />
    </div>
  );
}
