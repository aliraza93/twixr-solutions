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
    // Generous margin so content near the fold reveals immediately (no blank gaps).
    rootMargin = options.margin ?? "0px 0px 0px 0px",
    // 0 = any pixel visible is enough — critical for tall blocks (blog bodies).
    threshold = options.amount ?? 0,
  } = options;

  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => {
      el.classList.add("is-inview");
    };

    const isVisibleNow = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Any overlap with the viewport (including slightly above/below for hash jumps).
      return rect.bottom > 0 && rect.top < vh;
    };

    el.classList.add("scroll-reveal");

    if (prefersReducedMotion()) {
      el.setAttribute("data-reveal-ready", "");
      if (isVisibleNow()) {
        reveal();
        return;
      }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            reveal();
            if (once) observer.unobserve(el);
          }
        },
        { rootMargin, threshold }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }

    el.style.transitionDelay = `${delay + staggerIndex * stagger}s`;
    if (distance !== REVEAL_DISTANCE) {
      el.style.transform = `translateY(${distance}px)`;
    }

    // Already on screen (fold, hash jump, tall partial view): show immediately — no blank gap.
    if (isVisibleNow()) {
      el.setAttribute("data-reveal-ready", "");
      reveal();
      if (once) {
        return () => {
          el.style.transitionDelay = "";
        };
      }
    } else {
      // Off-screen: arm the hidden state, then reveal on intersection.
      el.setAttribute("data-reveal-ready", "");
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
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
