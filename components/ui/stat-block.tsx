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
  const [n, setN] = useState(parsed ? 0 : 0);

  useEffect(() => {
    if (!parsed) return;

    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setN(parsed.n);
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
          setN(Math.round(parsed.n * eased));
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
        {parsed ? (
          <>
            {parsed.prefix}
            {n}
            {parsed.suffix ? (
              <span className="ml-[0.12em] font-mono text-[0.42em] font-medium tracking-[0.08em] text-muted">
                {parsed.suffix}
              </span>
            ) : null}
          </>
        ) : (
          value
        )}
      </p>
      <p className="font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
    </div>
  );
}
