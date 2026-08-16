"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  DURATION,
  EASE,
  REVEAL_DISTANCE,
  STAGGER,
  useScrollReveal,
  type ScrollRevealOptions,
} from "@/hooks/use-scroll-reveal";

type ScrollRevealProps = ScrollRevealOptions & {
  children: ReactNode;
  className?: string;
};

export function ScrollReveal({
  children,
  className,
  amount,
  distance,
  delay,
  margin,
  stagger,
  staggerIndex,
  once,
  rootMargin,
  threshold,
}: ScrollRevealProps) {
  const { ref } = useScrollReveal({
    amount,
    distance,
    delay,
    margin,
    stagger,
    staggerIndex,
    once,
    rootMargin,
    threshold,
  });

  return (
    <div ref={ref} className={cn("scroll-reveal", className)}>
      {children}
    </div>
  );
}

type ScrollStaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  amount?: number;
  margin?: string;
  distance?: number;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ScrollStagger({
  children,
  className,
  stagger = STAGGER,
  amount = 0.08,
  margin = "0px 0px -6% 0px",
  distance = REVEAL_DISTANCE,
}: ScrollStaggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal-item]"));
    if (!items.length) return;

    if (prefersReducedMotion()) return;

    items.forEach((el, i) => {
      el.classList.add("scroll-reveal");
      el.style.transitionDelay = `${i * stagger}s`;
      if (distance !== REVEAL_DISTANCE) {
        el.style.transform = `translateY(${distance}px)`;
      }
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        items.forEach((el) => el.classList.add("is-inview"));
        observer.disconnect();
      },
      { threshold: amount, rootMargin: margin }
    );

    observer.observe(root);
    return () => {
      observer.disconnect();
      items.forEach((el) => {
        el.style.transitionDelay = "";
      });
    };
  }, [amount, distance, margin, stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

type ScrollRevealItemProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollRevealItem({ children, className }: ScrollRevealItemProps) {
  return (
    <div data-reveal-item className={cn("scroll-reveal", className)}>
      {children}
    </div>
  );
}

export { DURATION, EASE };
