"use client";

import { useEffect, useState, type ComponentType } from "react";

export function SiteEffects() {
  const [Cursor, setCursor] = useState<ComponentType | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches;
    if (reduce || touch) return;

    const run = () => {
      void import("@/components/ui/site-cursor").then((mod) => {
        setCursor(() => mod.SiteCursor);
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 1400 });
      return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(run, 240);
    return () => window.clearTimeout(id);
  }, []);

  return Cursor ? <Cursor /> : null;
}
