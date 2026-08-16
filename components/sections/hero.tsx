"use client";

import { useEffect, useState, type ComponentType, type CSSProperties } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { HeroRotatingWord } from "@/components/sections/hero-rotating-word";
import { HeroVisual, type HeroVisualImage } from "@/components/sections/hero-visual";
import { cn } from "@/lib/utils";

const STABLE_HEADING =
  "Build Scalable, Secure Web Apps with a Top 3% Developer";

const HEADING_LINES: {
  text?: string;
  kind: "plain" | "emphasis" | "cycle";
  i: number;
}[][] = (() => {
  let i = 0;
  return [
    [
      { text: "Build", kind: "plain" as const },
      { text: "Scalable,", kind: "plain" as const },
    ],
    [
      { kind: "cycle" as const },
      { text: "Web", kind: "plain" as const },
      { text: "Apps", kind: "plain" as const },
    ],
    [
      { text: "with", kind: "plain" as const },
      { text: "a", kind: "plain" as const },
      { text: "Top", kind: "emphasis" as const },
      { text: "3%", kind: "emphasis" as const },
    ],
    [{ text: "Developer", kind: "emphasis" as const }],
  ].map((line) => line.map((word) => ({ ...word, i: i++ })));
})();

const LOGOS = [
  { icon: "logos:laravel", label: "Laravel" },
  { icon: "logos:nodejs-icon", label: "Node.js" },
  { icon: "logos:aws", label: "AWS" },
  { icon: "logos:react", label: "React" },
  { icon: "logos:vue", label: "Vue" },
];

const MORE = [
  { icon: "logos:wordpress-icon", label: "WordPress" },
  { icon: "logos:docker-icon", label: "DevOps" },
  { icon: "logos:nextjs-icon", label: "Next.js" },
];

function wordClass(kind: "plain" | "emphasis") {
  if (kind === "emphasis") {
    return "bg-[image:var(--grad-emphasis)] bg-clip-text text-transparent";
  }
  return "text-ink";
}

export function Hero({ screenshot }: { screenshot?: HeroVisualImage }) {
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
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: "var(--glow-accent-light), var(--glow-lime-light)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in srgb, var(--ink) 3%, transparent) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />
      {Particles ? <Particles /> : null}

      <div className="ds-container relative z-10 flex min-h-svh flex-col justify-center pb-20 pt-[clamp(120px,16vh,200px)] lg:pb-24">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.95fr)] lg:gap-12 xl:gap-16">
          <div className="@container relative z-10 flex min-w-0 flex-col items-start">
            <Eyebrow>Full-stack engineering · Cloud · AI</Eyebrow>

            <h1 className="sr-only">{STABLE_HEADING}</h1>
            <div
              className="mt-5 w-full font-sora text-[length:clamp(2.25rem,7.8cqi,3.65rem)] font-extrabold leading-[1.05] tracking-[-0.02em]"
              aria-hidden="true"
            >
              {HEADING_LINES.map((line, lineIdx) => (
                <span key={lineIdx} className="hero-line lg:whitespace-nowrap">
                  {line.map((word) =>
                    word.kind === "cycle" ? (
                      <span
                        key="cycle"
                        className="hero-word mr-[0.28em]"
                        style={{ "--i": word.i } as CSSProperties}
                      >
                        <HeroRotatingWord />
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
              Senior Full Stack Engineer (7+ Years) specializing in Laravel, Next.js,
              and Cloud Infrastructure. I transform complex technical challenges into
              high-performance solutions.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" asChild>
                <Link href="/schedule">
                  Start a Project
                  <span
                    aria-hidden
                    className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                  >
                    →
                  </span>
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/portfolio">View Portfolio</Link>
              </Button>
            </div>

            <div className="mt-10 flex w-full min-w-0 flex-col gap-4">
              <p className="font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em] text-muted">
                Powering solutions with
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {LOGOS.map((logo) => (
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
                    +3 More
                  </button>
                  <div
                    id="hero-more-stack"
                    className={cn(
                      "absolute bottom-full left-0 z-20 mb-3 w-max rounded-lg border border-hairline bg-canvas p-4 shadow-md",
                      moreOpen ? "block" : "hidden group-hover:block"
                    )}
                  >
                    <div className="flex gap-6">
                      {MORE.map((item) => (
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
            <HeroVisual image={screenshot} />
          </div>
        </div>

        <a
          href="#workflow"
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
