"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Cloud, Sparkles, User, type LucideIcon } from "lucide-react";
import { philosophy } from "@/content/philosophy";
import { EquationRow } from "@/components/ui/equation-row";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

const TILE_ICONS: Record<(typeof philosophy.tiles)[number]["icon"], LucideIcon> = {
  user: User,
  cloud: Cloud,
  sparkles: Sparkles,
};

function tileIcon(icon: (typeof philosophy.tiles)[number]["icon"]) {
  const Icon = TILE_ICONS[icon];
  return <Icon />;
}

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
        <Eyebrow className="justify-center">{philosophy.eyebrow}</Eyebrow>

        <h2 className="mt-5 max-w-[18ch] font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
          <span className="block">{philosophy.headingLine1}</span>
          <span
            className="eq-reveal mt-1 block text-pine"
            style={{ "--i": 0 } as CSSProperties}
          >
            {philosophy.headingLine2}
          </span>
        </h2>

        <EquationRow
          className="mt-14 md:mt-16"
          durationMs={1800}
          a={{ icon: tileIcon(philosophy.tiles[0].icon), label: philosophy.tiles[0].label }}
          b={{ icon: tileIcon(philosophy.tiles[1].icon), label: philosophy.tiles[1].label }}
          c={{ icon: tileIcon(philosophy.tiles[2].icon), label: philosophy.tiles[2].label }}
          onFinale={() => setFinale(true)}
        />

        <p
          className={cn(
            "eq-mission mt-14 max-w-[40ch] font-sora text-[length:var(--fs-h2)] font-bold leading-[1.2] tracking-[-0.02em] md:mt-16",
            finale && "is-visible"
          )}
        >
          <span className="text-muted">{philosophy.missionMuted}</span>
          <span className="text-ink">{philosophy.missionEmphasis}</span>
        </p>
      </div>
    </section>
  );
}
