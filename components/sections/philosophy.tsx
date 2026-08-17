"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Bot, Sparkles, User } from "lucide-react";
import { EquationRow } from "@/components/ui/equation-row";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

export function Philosophy() {
  const ref = useRef<HTMLElement>(null);
  const [finale, setFinale] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-inview");
      setFinale(true);
      return;
    }

    el.classList.add("eq-armed");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("is-inview");
        observer.disconnect();
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="philosophy"
      className="philosophy-band relative overflow-hidden bg-canvas py-[var(--section-py)]"
    >
      <div className="ds-container relative z-10 flex flex-col items-center text-center">
        <Eyebrow className="justify-center">Our Philosophy</Eyebrow>

        <h2 className="mt-5 max-w-[18ch] font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
          <span className="block">Senior engineering,</span>
          <span
            className="eq-reveal mt-1 block text-pine"
            style={{ "--i": 0 } as CSSProperties}
          >
            amplified by AI.
          </span>
        </h2>

        <EquationRow
          className="mt-14 md:mt-16"
          durationMs={1800}
          a={{ icon: <User />, label: "Deep engineering" }}
          b={{ icon: <Bot />, label: "AI-augmented workflow" }}
          c={{ icon: <Sparkles />, label: "Shipped faster" }}
          onFinale={() => setFinale(true)}
        />

        <p
          className={cn(
            "eq-mission mt-14 max-w-[22ch] font-sora text-[length:var(--fs-h2)] font-bold leading-[1.2] tracking-[-0.02em] md:mt-16",
            finale && "is-visible"
          )}
        >
          <span className="text-muted">The goal isn&apos;t more code. It&apos;s to </span>
          <span className="text-ink">ship outcomes.</span>
        </p>
      </div>
    </section>
  );
}
