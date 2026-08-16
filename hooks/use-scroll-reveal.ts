"use client";

import { useEffect, useRef } from "react";
import {
  DURATION,
  REVEAL_DISTANCE,
  STAGGER,
} from "@/lib/motion";

export {
  DURATION,
  DURATION_BASE,
  DURATION_FAST,
  DURATION_SLOW,
  EASE,
  EASE_INOUT,
  REVEAL_DISTANCE,
  STAGGER,
} from "@/lib/motion";

/** @deprecated Use `EASE` — kept for existing Framer Motion callers */
export const SCROLL_REVEAL_EASE = [0.22, 1, 0.36, 1] as const;

/** @deprecated Use `DURATION` + `EASE` */
export const SCROLL_REVEAL_TRANSITION = {
  duration: DURATION,
  ease: SCROLL_REVEAL_EASE,
} as const;

export type ScrollRevealOptions = {
  delay?: number;
  stagger?: number;
  staggerIndex?: number;
  distance?: number;
  once?: boolean;
  rootMargin?: string;
  threshold?: number;
  /** @deprecated Ignored — IntersectionObserver uses `threshold` */
  amount?: number;
  /** @deprecated Use `rootMargin` */
  margin?: string;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const {
    delay = 0,
    stagger = STAGGER,
    staggerIndex = 0,
    distance = REVEAL_DISTANCE,
    once = true,
    rootMargin = options.margin ?? "0px 0px -8% 0px",
    threshold = options.amount ?? 0.12,
  } = options;

  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.classList.remove("scroll-reveal");
      el.style.opacity = "";
      el.style.transform = "";
      el.style.transitionDelay = "";
      return;
    }

    el.classList.add("scroll-reveal");
    el.style.transitionDelay = `${delay + staggerIndex * stagger}s`;
    if (distance !== REVEAL_DISTANCE) {
      el.style.transform = `translateY(${distance}px)`;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-inview");
          if (once) observer.unobserve(el);
        } else if (!once) {
          el.classList.remove("is-inview");
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      el.style.transitionDelay = "";
    };
  }, [delay, stagger, staggerIndex, distance, once, rootMargin, threshold]);

  return { ref, reduceMotion: prefersReducedMotion() };
}
