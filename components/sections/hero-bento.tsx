"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import type { HeroContent } from "@/lib/cms/types";

/**
 * The hero's bento cluster.
 *
 * Structure borrowed from the OpenBank shot by Dipa Inhouse: four tiles in a
 * pinwheel where the column widths swap between rows, and two shape families
 * held in contrast - photo tiles as rounded squares, data tiles as stadiums.
 * Everything else (palette, type, content, motion) is this site's own.
 *
 * Every figure here is real. There is deliberately one photograph, because
 * one real photograph exists; the portfolio's images are all generic stock
 * and a tile filled with one would undo the point of the hero.
 */

const MAX_TILT = 6;

function canTilt() {
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(hover: hover)").matches
  );
}

type Bento = NonNullable<HeroContent["bento"]>;

export function HeroBento({ bento }: { bento: Bento }) {
  const ref = useRef<HTMLDivElement>(null);

  // Cursor parallax on the whole cluster, capped at 6 degrees so it reads as
  // depth rather than as a toy. Pointer-driven only, never on touch.
  useEffect(() => {
    const node = ref.current;
    if (!node || !canTilt()) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = node.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        node.style.setProperty("--rx", `${(-y * MAX_TILT).toFixed(2)}deg`);
        node.style.setProperty("--ry", `${(x * MAX_TILT).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      node.style.setProperty("--rx", "0deg");
      node.style.setProperty("--ry", "0deg");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    node.addEventListener("pointerleave", onLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="hero-bento relative w-full"
      style={{ "--rx": "0deg", "--ry": "0deg" } as React.CSSProperties}
    >
      {/* Row one: wide photo, narrow stadium. */}
      <div className="flex h-[clamp(168px,23vw,278px)] items-stretch gap-3 sm:gap-4">
        <figure className="hero-tile hero-tile--float relative m-0 flex-[1.55] overflow-hidden rounded-[var(--r-xl)] border border-hairline bg-surface">
          <Image
            src={bento.photo.src}
            alt={bento.photo.alt}
            fill
            sizes="(min-width: 1024px) 28vw, 45vw"
            className="object-cover"
            priority
          />
          <figcaption className="absolute inset-x-3 bottom-3 rounded-pill bg-canvas/90 px-3 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink backdrop-blur-sm">
            {bento.photo.caption}
          </figcaption>
        </figure>

        <div className="hero-tile flex flex-[1] flex-col items-center justify-center gap-1.5 rounded-[999px] border border-hairline bg-accent-tint px-4 py-5 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pine">
            <Check className="h-4 w-4 text-white" strokeWidth={3} aria-hidden />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            {bento.proof.badge}
          </span>
          <span className="font-sora text-base font-bold leading-tight tracking-[-0.02em] text-ink">
            {bento.proof.title}
          </span>
          <span className="text-xs leading-snug text-muted">
            {bento.proof.note}
          </span>
        </div>
      </div>

      {/* Row two: the widths swap. That alternation is what stops the cluster
          reading as a plain four-up grid. */}
      <div className="mt-3 flex h-[clamp(168px,23vw,278px)] items-stretch gap-3 sm:mt-4 sm:gap-4">
        <div className="hero-tile hero-tile--float-slow flex flex-[1] flex-col items-center justify-center gap-1 rounded-[999px] bg-ink px-4 py-5 text-center">
          <span className="font-sora text-[length:var(--fs-h2)] font-extrabold leading-none tracking-[-0.03em] text-d-text tabular-nums">
            {bento.metric.value}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-d-lime">
            {bento.metric.label}
          </span>
          <span className="mt-1 text-xs leading-snug text-d-muted">
            {bento.metric.note}
          </span>
        </div>

        <div className="hero-tile flex flex-[1.55] flex-col overflow-hidden rounded-[var(--r-xl)] border border-hairline bg-canvas">
          <div className="flex items-center gap-1.5 border-b border-hairline bg-surface px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-2" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-2" />
            <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
            <span className="ml-1.5 font-mono text-[10px] tracking-wide text-muted">
              {bento.code.file}
            </span>
          </div>
          <pre className="flex flex-1 flex-col justify-center overflow-hidden px-4 py-3 font-mono text-[11px] leading-[1.8] text-ink-soft sm:text-[12.5px]">
            <code>
              {bento.code.lines.map((line) => (
                <span
                  key={line}
                  className={
                    line.trim().startsWith("//")
                      ? "block text-muted"
                      : "block"
                  }
                >
                  {line}
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
