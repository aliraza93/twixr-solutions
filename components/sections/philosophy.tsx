"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Bot, Sparkles, User } from "lucide-react";
import { EquationRow } from "@/components/ui/equation-row";
import { Eyebrow } from "@/components/ui/eyebrow";

export function Philosophy() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-inview");
      return;
    }

    el.classList.add("eq-armed");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("is-inview");
        observer.disconnect();
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
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
          a={{ icon: <User />, label: "Deep engineering" }}
          b={{ icon: <Bot />, label: "AI-augmented workflow" }}
          c={{ icon: <Sparkles />, label: "Shipped faster" }}
        />

        <p
          className="eq-reveal mt-14 max-w-[22ch] font-sora text-[length:var(--fs-h2)] font-bold leading-[1.2] tracking-[-0.02em] md:mt-16"
          style={{ "--i": 6 } as CSSProperties}
        >
          <span className="text-muted">The goal isn&apos;t more code. It&apos;s to </span>
          <span className="text-ink">ship outcomes.</span>
        </p>
      </div>
    </section>
  );
}
