"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DURATION } from "@/lib/motion";

type StatBlockProps = {
  value: string;
  label: string;
  className?: string;
};

function parseValue(value: string) {
  const match = value.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  return { prefix: match[1], n: Number(match[2]), suffix: match[3] };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function StatBlock({ value, label, className }: StatBlockProps) {
  const parsed = parseValue(value);
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(parsed ? `${parsed.prefix}0${parsed.suffix}` : value);

  useEffect(() => {
    if (!parsed) {
      setDisplay(value);
      return;
    }

    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const duration = DURATION * 1000;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const current = Math.round(parsed.n * eased);
          setDisplay(`${parsed.prefix}${current}${parsed.suffix}`);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [parsed, value]);

  return (
    <div ref={ref} className={cn("flex flex-col gap-2", className)}>
      <p className="font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink">
        {display}
      </p>
      <p className="font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
    </div>
  );
}
