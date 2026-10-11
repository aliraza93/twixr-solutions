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
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { HeroBento } from "@/components/sections/hero-bento";
import { hero as fallbackHero } from "@/content/hero";
import { cn } from "@/lib/utils";
import type { HeroContent } from "@/lib/cms/types";

/**
 * Hero.
 *
 * Composition follows the OpenBank shot by Dipa Inhouse: an asymmetric split
 * with the claim on the left, a pinwheel bento on the right, and the social
 * proof sitting inline with the actions rather than in its own band. The
 * visual world is entirely this site's - Sora, pine and lime, hairlines, no
 * gradients - and every figure in the tiles is real.
 *
 * The headline steps down from --fs-display to --fs-h1 because a two-column
 * hero cannot carry 88px type without crowding the cluster. That is the trade
 * this layout makes.
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
  const bento = hero.bento ?? (fallbackHero as unknown as HeroContent).bento;
  const rating = hero.rating ?? (fallbackHero as unknown as HeroContent).rating;
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

  // One entrance for the whole fold: the stagger carries on through the lead,
  // the actions and the tile cluster instead of each animating separately.
  const after = words.length;

  return (
    <section className="relative isolate flex flex-col overflow-x-hidden bg-canvas lg:min-h-svh">
      <div className="dot-grid pointer-events-none absolute inset-0 z-0" aria-hidden />
      {Particles ? <Particles /> : null}

      <div className="ds-container relative z-10 flex flex-1 flex-col justify-center pb-12 pt-[clamp(104px,15vh,184px)]">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)] lg:gap-14">
          <div className="min-w-0">
            <Eyebrow>{hero.eyebrow}</Eyebrow>

            {/* The separator is a real text node between the spans: as a
                margin, h1.textContent read as one run-on word for crawlers
                and screen readers. */}
            <h1 className="mt-5 max-w-[17ch] text-balance font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.04] tracking-[-0.03em]">
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
              className="hero-word mt-5 max-w-[52ch] text-[length:var(--fs-lead)] leading-relaxed text-muted"
              style={{ "--i": after } as CSSProperties}
            >
              {hero.subheading}
            </p>

            {/* Actions and proof on one line, as the reference does. */}
            <div
              className="hero-word mt-8 flex flex-wrap items-center gap-x-5 gap-y-4"
              style={{ "--i": after + 1 } as CSSProperties}
            >
              <div className="flex flex-wrap items-center gap-3">
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
                  <Link href={hero.secondaryCta.href}>
                    {hero.secondaryCta.label}
                  </Link>
                </Button>
              </div>

              {rating ? (
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-0.5" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-lime-deep text-lime-deep"
                      />
                    ))}
                  </span>
                  <span className="text-sm text-muted">
                    <strong className="font-semibold text-ink">
                      {rating.score}
                    </strong>{" "}
                    from {rating.count}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {bento ? (
            <div
              className="hero-word min-w-0"
              style={{ "--i": after + 2 } as CSSProperties}
            >
              <HeroBento bento={bento} />
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="hero-word relative z-10 border-t border-hairline"
        style={{ "--i": after + 3 } as CSSProperties}
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
                <span className="text-sm font-medium text-ink-soft">
                  {logo.label}
                </span>
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
