"use client";

import { useEffect, useState, type ComponentType, type CSSProperties } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { HeroRotatingWord } from "@/components/sections/hero-rotating-word";
import { HeroVisual, type HeroVisualImage } from "@/components/sections/hero-visual";
import { hero as fallbackHero } from "@/content/hero";
import { cn } from "@/lib/utils";
import type { HeroContent } from "@/lib/cms/types";

function headingLinesOf(content: HeroContent) {
  let i = 0;
  return content.headingLines.map((line) =>
    line.map((word) => ({ ...word, i: i++ }))
  );
}

function wordClass(kind: "plain" | "emphasis") {
  if (kind === "emphasis") {
    return "text-pine";
  }
  return "text-ink";
}

export function Hero({
  screenshot,
  content,
}: {
  screenshot?: HeroVisualImage;
  content?: HeroContent;
}) {
  const hero = content ?? (fallbackHero as unknown as HeroContent);
  const headingLines = headingLinesOf(hero);
  const logos = hero.techLogos;
  const more = hero.moreLogos;
  const [moreOpen, setMoreOpen] = useState(false);
  const [Particles, setParticles] = useState<ComponentType | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches;
    if (reduce || touch) return;

    const run = () => {
      void import("@/components/sections/hero-particles").then((mod) => {
        setParticles(() => mod.HeroParticles);
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(run, 200);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section className="relative isolate min-h-svh overflow-x-hidden bg-canvas">
      <div className="dot-grid pointer-events-none absolute inset-0 z-0" aria-hidden />
      {Particles ? <Particles /> : null}

      <div className="ds-container relative z-10 flex min-h-svh flex-col justify-center pb-20 pt-[clamp(120px,16vh,200px)] lg:pb-24">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.95fr)] lg:gap-12 xl:gap-16">
          <div className="@container relative z-10 flex min-w-0 flex-col items-start">
            <Eyebrow>{hero.eyebrow}</Eyebrow>

            <h1 className="sr-only">{hero.stableHeading}</h1>
            <div
              className="mt-5 w-full font-sora text-[length:clamp(2.25rem,7.8cqi,3.65rem)] font-extrabold leading-[1.05] tracking-[-0.02em]"
              aria-hidden="true"
            >
              {headingLines.map((line, lineIdx) => (
                <span key={lineIdx} className="hero-line lg:whitespace-nowrap">
                  {line.map((word) =>
                    word.kind === "cycle" ? (
                      <span
                        key="cycle"
                        className="hero-word"
                        style={{ "--i": word.i } as CSSProperties}
                      >
                        <HeroRotatingWord words={hero.rotatingWords} />
                      </span>
                    ) : (
                      <span
                        key={`${word.text}-${word.i}`}
                        className={cn(
                          "hero-word mr-[0.28em] last:mr-0",
                          wordClass(word.kind)
                        )}
                        style={{ "--i": word.i } as CSSProperties}
                      >
                        {word.text}
                      </span>
                    )
                  )}
                </span>
              ))}
            </div>

            <p className="mt-5 max-w-[52ch] text-[length:var(--fs-lead)] text-muted">
              {hero.subheading}
            </p>
            <p className="mt-3 font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.14em] text-muted">
              {hero.proofChip}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" asChild>
                <Link href={hero.primaryCta.href}>
                  {hero.primaryCta.label}
                  <span
                    aria-hidden
                    className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                  >
                    →
                  </span>
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
              </Button>
            </div>

            <div className="mt-10 flex w-full min-w-0 flex-col gap-4">
              <p className="font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em] text-muted">
                {hero.logosCaption}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {logos.map((logo) => (
                  <div
                    key={logo.label}
                    className="flex items-center gap-2 opacity-70 grayscale transition-[opacity,filter] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:opacity-100 hover:grayscale-0"
                  >
                    <Icon icon={logo.icon} className="h-5 w-5" />
                    <span className="text-sm font-medium text-ink-soft">{logo.label}</span>
                  </div>
                ))}

                <div
                  className="group relative"
                  onMouseEnter={() => setMoreOpen(true)}
                  onMouseLeave={() => setMoreOpen(false)}
                >
                  <button
                    type="button"
                    data-cursor
                    aria-expanded={moreOpen}
                    aria-controls="hero-more-stack"
                    onClick={() => setMoreOpen((open) => !open)}
                    className="rounded-pill border border-hairline px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted transition-colors duration-[var(--dur-fast)] hover:border-pine hover:text-pine"
                  >
                    +{more.length} More
                  </button>
                  <div
                    id="hero-more-stack"
                    className={cn(
                      "absolute bottom-full left-0 z-20 mb-3 w-max rounded-lg border border-hairline bg-canvas p-4 shadow-md",
                      moreOpen ? "block" : "hidden group-hover:block"
                    )}
                  >
                    <div className="flex gap-6">
                      {more.map((item) => (
                        <div key={item.label} className="flex flex-col items-center gap-2">
                          <Icon icon={item.icon} className="h-6 w-6" />
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-0 min-w-0 pb-12 lg:pb-10">
            <HeroVisual image={screenshot} dashboard={hero.dashboard} />
          </div>
        </div>

        <a
          href={hero.scrollHref}
          className="mt-10 inline-flex items-center gap-3 self-start font-mono text-[length:var(--fs-eyebrow)] uppercase tracking-[0.18em] text-muted transition-colors hover:text-pine lg:mt-12"
        >
          Scroll
          <span
            aria-hidden
            className="hero-scroll-line inline-block h-8 w-px origin-top bg-pine"
          />
        </a>
      </div>
    </section>
  );
}
