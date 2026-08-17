"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Bot, User, Users } from "lucide-react";
import { delivery } from "@/content/delivery";
import { EquationRow } from "@/components/ui/equation-row";
import { Eyebrow } from "@/components/ui/eyebrow";

const PILLS = delivery.pills;

export function DeliveryModel() {
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
      id="together"
      className="band-dark relative overflow-hidden py-[var(--section-py)]"
    >
      <div className="ds-container relative z-10 flex flex-col items-center text-center">
        <Eyebrow className="justify-center">{delivery.eyebrow}</Eyebrow>

        <h2 className="mt-5 max-w-[16ch] font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
          <span className="block">{delivery.headingLine1}</span>
          <span
            className="eq-reveal mt-1 block text-lime"
            style={{ "--i": 0 } as CSSProperties}
          >
            {delivery.headingLine2}
          </span>
        </h2>

        <p className="mt-5 max-w-[52ch] text-[length:var(--fs-lead)] text-muted">
          {delivery.lead}
        </p>

        <EquationRow
          className="mt-14 md:mt-16"
          shape="circle"
          a={{ icon: <User />, label: delivery.tiles[0].label, sublabel: delivery.tiles[0].sublabel }}
          b={{
            icon: <Bot />,
            label: delivery.tiles[1].label,
            sublabel: delivery.tiles[1].sublabel,
          }}
          c={{
            icon: <Users />,
            label: delivery.tiles[2].label,
            sublabel: delivery.tiles[2].sublabel,
          }}
        />

        <ul className="mt-14 flex list-none flex-wrap items-center justify-center gap-3 p-0 md:mt-16">
          {PILLS.map((pill, i) => (
            <li
              key={pill}
              className="eq-reveal rounded-pill border border-hairline px-4 py-2 font-mono text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft"
              style={{ "--i": 7 + i } as CSSProperties}
            >
              {pill}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
