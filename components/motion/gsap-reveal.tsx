"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

let registered = false;

function ensureGsap() {
  if (typeof window === "undefined" || registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type GsapRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: ElementType;
};

export function GsapReveal({
  children,
  className,
  delay = 0,
  y = 36,
  as: Tag = "div",
}: GsapRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    ensureGsap();
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [delay, y]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

type GsapStaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
};

export function GsapStagger({ children, className, stagger = 0.07, y = 28 }: GsapStaggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureGsap();
    const el = ref.current;
    if (!el) return;

    const items = el.querySelectorAll("[data-gsap-item]");
    if (!items.length) return;

    if (prefersReducedMotion()) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [stagger, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function GsapStaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-gsap-item className={cn(className)}>
      {children}
    </div>
  );
}
