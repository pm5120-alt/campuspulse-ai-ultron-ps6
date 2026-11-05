"use client";

import React, { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      prevent: (node) => {
        if (!node || !(node instanceof HTMLElement)) return false;
        // Do not intercept scroll events inside any scrollable container, dropdown, popup, or modal
        return (
          node.hasAttribute("data-lenis-prevent") ||
          node.closest("[data-lenis-prevent]") !== null ||
          node.classList.contains("custom-scrollbar") ||
          node.classList.contains("overflow-y-auto") ||
          node.classList.contains("overflow-auto") ||
          node.closest(".custom-scrollbar") !== null ||
          node.closest(".overflow-y-auto") !== null ||
          node.closest("[role='dialog']") !== null ||
          node.closest(".modal-content") !== null
        );
      },
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
