"use client";

import { useEffect, useRef } from "react";

function shouldRun() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.matchMedia("(pointer: coarse)").matches) return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, [data-cursor]";

export function HeroCursor() {
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring || !shouldRun()) {
      if (ring) ring.hidden = true;
      return;
    }

    document.documentElement.classList.add("has-hero-cursor");
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { ...pos };
    let hovering = false;
    let frame = 0;

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      const scale = hovering ? 1.6 : 1;
      ring.style.transform = `translate3d(${pos.x - 14}px, ${pos.y - 14}px, 0) scale(${scale})`;
      frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      hovering = Boolean((event.target as Element | null)?.closest(INTERACTIVE));
      ring.dataset.hot = hovering ? "true" : "false";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("has-hero-cursor");
    };
  }, []);

  return (
    <div
      ref={ringRef}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[80] hidden h-7 w-7 rounded-full border-[1.5px] border-ink bg-transparent transition-[background-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)] md:block data-[hot=true]:bg-pine-tint data-[hot=true]:shadow-sm"
    />
  );
}
