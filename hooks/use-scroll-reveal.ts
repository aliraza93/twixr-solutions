"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion, type Transition } from "framer-motion";

export const SCROLL_REVEAL_EASE = [0.22, 1, 0.36, 1] as const;

export const SCROLL_REVEAL_TRANSITION: Transition = {
  duration: 0.55,
  ease: SCROLL_REVEAL_EASE,
};

export type ScrollRevealOptions = {
  amount?: number;
  distance?: number;
  delay?: number;
  margin?: string;
};

function getHiddenOffset(el: HTMLElement, distance: number) {
  const rect = el.getBoundingClientRect();
  const viewportMid = window.innerHeight / 2;
  const elementMid = rect.top + rect.height / 2;
  return elementMid > viewportMid ? distance : -distance;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const distance = options.distance ?? 28;
  const ref = useRef<T>(null);
  const isInView = useInView(ref, {
    amount: options.amount ?? 0.12,
    margin: (options.margin ?? "0px 0px -6% 0px") as `${number}px ${number}px ${number}px ${number}px`,
  });
  const reduceMotion = useReducedMotion();
  const [hiddenY, setHiddenY] = useState(distance);

  const updateHiddenOffset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setHiddenY(getHiddenOffset(el, distance));
  }, [distance]);

  useEffect(() => {
    updateHiddenOffset();
    if (isInView) return;

    window.addEventListener("scroll", updateHiddenOffset, { passive: true });
    window.addEventListener("resize", updateHiddenOffset);
    return () => {
      window.removeEventListener("scroll", updateHiddenOffset);
      window.removeEventListener("resize", updateHiddenOffset);
    };
  }, [isInView, updateHiddenOffset]);

  const transition: Transition = {
    ...SCROLL_REVEAL_TRANSITION,
    delay: options.delay ?? 0,
  };

  if (reduceMotion) {
    return { ref, isInView, reduceMotion: true as const };
  }

  return {
    ref,
    isInView,
    reduceMotion: false as const,
    initial: false as const,
    animate: isInView
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: hiddenY },
    transition,
    hiddenY,
  };
}
