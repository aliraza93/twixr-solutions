"use client";

import { useEffect, useRef } from "react";

function shouldRun() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.matchMedia("(pointer: coarse)").matches) return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

const INTERACTIVE =
  "a, button, [role='button'], input, textarea, select, summary, [data-cursor]";

export function SiteCursor() {
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring || !shouldRun()) {
      if (ring) ring.hidden = true;
      return;
    }

    document.documentElement.classList.add("has-site-cursor");
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { ...pos };
    let hovering = false;
    let dark = false;
    let keyboard = false;
    let frame = 0;

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      const scale = hovering ? 1.6 : 1;
      ring.style.transform = `translate3d(${pos.x - 14}px, ${pos.y - 14}px, 0) scale(${scale})`;
      frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      keyboard = false;
      ring.hidden = false;
      target.x = event.clientX;
      target.y = event.clientY;
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      hovering = Boolean(hit?.closest(INTERACTIVE));
      dark = Boolean(hit?.closest(".band-dark, [data-cursor-dark]"));
      ring.dataset.hot = hovering ? "true" : "false";
      ring.dataset.dark = dark ? "true" : "false";
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      keyboard = true;
      ring.hidden = true;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("keydown", onKey);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("has-site-cursor");
      void keyboard;
    };
  }, []);

  return (
    <div
      ref={ringRef}
      aria-hidden
      className="site-cursor pointer-events-none fixed top-0 left-0 z-[50] hidden h-7 w-7 rounded-full border-[1.5px] border-ink bg-transparent md:block"
    />
  );
}
