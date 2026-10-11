"use client";

import {
  Fragment,
  useEffect,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { hero as fallbackHero } from "@/content/hero";
import { cn } from "@/lib/utils";
import type { HeroContent } from "@/lib/cms/types";

/**
 * Hero - "The Statement".
 *
 * The previous hero stacked nine competing elements beside a mock of someone
 * else's dashboard, and rendered the display type at 3.65rem when the design
 * system defines 5.5rem for it. This is one claim at full display scale, one
 * supporting line, one primary action, and the real Upwork figures promoted
 * from 11px inside a fake browser window to a readable ledger across the
 * bottom of the fold. Five elements, not nine.
 */

function headingWords(content: HeroContent) {
  return content.headingLines
    .flat()
    // A stored CMS row may still carry the retired rotating-word slot.
    .filter((word) => word.kind !== "cycle" && word.text)
    .map((word, i) => ({ ...word, i }));
}

export function Hero({ content }: { content?: HeroContent }) {
  const hero = content ?? (fallbackHero as unknown as HeroContent);
  const words = headingWords(hero);
  const stats = hero.stats?.length ? hero.stats : hero.dashboard.stats;
  const stack = [...hero.techLogos, ...hero.moreLogos];
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

  // The stagger continues through the lead, actions and ledger so the whole
  // fold resolves as one authored entrance rather than four separate ones.
  const afterHeading = words.length;

  return (
    <section className="relative isolate flex flex-col overflow-x-hidden bg-canvas sm:min-h-svh">
      <div className="dot-grid pointer-events-none absolute inset-0 z-0" aria-hidden />
      {Particles ? <Particles /> : null}

      <div className="ds-container relative z-10 flex flex-1 flex-col justify-center pb-10 pt-[clamp(104px,16vh,208px)]">
        <Eyebrow>{hero.eyebrow}</Eyebrow>

        {/* The rag is set by the measure, not by hardcoded line breaks, so an
            editor can change the headline without re-balancing it by hand. */}
        <h1 className="mt-6 max-w-[15ch] text-balance font-sora text-[length:var(--fs-display)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          {/* The separator is a real text node BETWEEN the spans. A margin
              left h1.textContent as one run-on word for crawlers and screen
              readers; a space inside an inline-block gets trimmed and
              collapses visually. A sibling space satisfies both. */}
          {words.map((word, idx) => (
            <Fragment key={`${word.text}-${word.i}`}>
              <span
                className={cn(
                  "hero-word",
                  word.kind === "emphasis" ? "text-pine" : "text-ink"
                )}
                style={{ "--i": word.i } as CSSProperties}
              >
                {word.text}
              </span>
              {idx < words.length - 1 ? " " : null}
            </Fragment>
          ))}
        </h1>

        <p
          className="hero-word mt-7 max-w-[58ch] text-[length:var(--fs-lead)] leading-relaxed text-muted"
          style={{ "--i": afterHeading } as CSSProperties}
        >
          {hero.subheading}
        </p>

        <div
          className="hero-word mt-9 flex flex-wrap items-center gap-3"
          style={{ "--i": afterHeading + 1 } as CSSProperties}
        >
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
      </div>

      {/* Proof ledger: the one asset a template cannot fake, at a size that
          can actually be read. Rules, not cards. */}
      <div
        className="hero-word relative z-10 border-t border-hairline"
        style={{ "--i": afterHeading + 2 } as CSSProperties}
      >
        <div className="ds-container">
          <dl className="grid grid-cols-2 sm:grid-cols-4">
            {stats.map((stat, idx) => (
              <div
                key={stat.label}
                className={cn(
                  "flex flex-col gap-1 py-5 sm:py-7",
                  idx > 0 && "sm:border-l sm:border-hairline sm:pl-6",
                  idx === 1 && "border-l border-hairline pl-6 sm:pl-6",
                  idx === 2 && "border-t border-hairline sm:border-t-0",
                  idx === 3 && "border-l border-t border-hairline pl-6 sm:border-t-0"
                )}
              >
                <dd className="font-sora text-[length:var(--fs-h3)] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums sm:text-[length:var(--fs-h2)]">
                  {stat.value}
                  <span className="text-pine">{stat.unit}</span>
                </dd>
                <dt className="font-mono text-[length:var(--fs-eyebrow)] uppercase tracking-[0.16em] text-muted">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div
        className="hero-word relative z-10 border-t border-hairline"
        style={{ "--i": afterHeading + 3 } as CSSProperties}
      >
        <div className="ds-container flex flex-wrap items-center gap-x-6 gap-y-3 py-5">
          <span className="font-mono text-[length:var(--fs-eyebrow)] uppercase tracking-[0.18em] text-muted">
            {hero.logosCaption}
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {stack.map((logo) => (
              <span
                key={logo.label}
                className="flex items-center gap-2 opacity-60 grayscale transition-[opacity,filter] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:opacity-100 hover:grayscale-0"
              >
                <Icon icon={logo.icon} className="h-[18px] w-[18px]" aria-hidden />
                <span className="text-sm font-medium text-ink-soft">{logo.label}</span>
              </span>
            ))}
          </div>
          <a
            href={hero.scrollHref}
            className="ml-auto hidden items-center gap-3 font-mono text-[length:var(--fs-eyebrow)] uppercase tracking-[0.18em] text-muted transition-colors hover:text-pine sm:inline-flex"
          >
            Scroll
            <span
              aria-hidden
              className="hero-scroll-line inline-block h-6 w-px origin-top bg-pine"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
