"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroContent } from "@/lib/cms/types";

/**
 * The hero's bento cluster.
 *
 * Structure from the OpenBank shot by Dipa Inhouse: a pinwheel where the
 * column widths swap between rows, and two shape families in contrast -
 * rectangles with a large radius against stadiums. Everything else is ours.
 *
 * Two deliberate departures from the earlier pass:
 *
 * - It is a CSS grid with explicit spans, not two flex rows. The rows used to
 *   size independently, so the pinwheel never sat in register.
 * - There is one motion, not three. Per-tile float loops on different
 *   durations meant the tiles drifted apart from each other at rest, which
 *   read as broken alignment. The cluster now tilts as a single object.
 *
 * Every tile states a result a client gets. None of them is about the founder.
 */

const MAX_TILT = 5;

function canTilt() {
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(hover: hover)").matches
  );
}

type Bento = NonNullable<HeroContent["bento"]>;

const tileBase =
  "hero-tile relative flex flex-col justify-between overflow-hidden transition-[transform,box-shadow] duration-[var(--dur)] ease-[var(--ease-out)]";

export function HeroBento({ bento }: { bento: Bento }) {
  const ref = useRef<HTMLDivElement>(null);

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
      className="hero-bento grid w-full grid-cols-5 gap-3 [grid-auto-rows:clamp(158px,20vw,236px)] sm:gap-4"
      style={{ "--rx": "0deg", "--ry": "0deg" } as React.CSSProperties}
    >
      {/* The result. Largest tile, because it is the only thing on this
          screen that proves anything. */}
      <div
        className={cn(
          tileBase,
          "col-span-3 rounded-[var(--r-xl)] bg-ink p-5 sm:p-6",
          "hover:-translate-y-0.5"
        )}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-d-lime">
          {bento.result.eyebrow}
        </span>
        <div className="flex items-baseline gap-2 sm:gap-3">
          <span className="font-sora text-[length:clamp(2rem,4.4vw,3.25rem)] font-extrabold leading-none tracking-[-0.04em] text-d-muted tabular-nums line-through decoration-[0.06em] decoration-d-muted/50">
            {bento.result.from}
          </span>
          <ArrowRight
            className="h-5 w-5 shrink-0 text-d-lime sm:h-6 sm:w-6"
            strokeWidth={2.5}
            aria-hidden
          />
          <span className="font-sora text-[length:clamp(2.6rem,5.8vw,4.25rem)] font-extrabold leading-none tracking-[-0.04em] text-d-text tabular-nums">
            {bento.result.to}
          </span>
        </div>
        <span className="text-sm leading-snug text-d-muted">
          {bento.result.caption}
        </span>
      </div>

      {/* Upwork record, framed as delivery rather than as a rating. */}
      <div
        className={cn(
          tileBase,
          "col-span-2 items-center justify-center gap-1.5 rounded-[999px] border border-hairline bg-accent-tint px-4 py-6 text-center",
          "hover:-translate-y-0.5"
        )}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pine">
          <Check className="h-4 w-4 text-white" strokeWidth={3} aria-hidden />
        </span>
        <span className="font-sora text-[length:clamp(1.6rem,3vw,2.1rem)] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
          {bento.proof.value}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {bento.proof.label}
        </span>
        <span className="text-xs leading-snug text-muted">
          {bento.proof.note}
        </span>
      </div>

      {/* Row two: the widths swap. That alternation is the whole point of a
          pinwheel - a plain 2x2 reads as a table. */}
      <div
        className={cn(
          tileBase,
          "col-span-2 items-center justify-center gap-1.5 rounded-[999px] border border-hairline bg-surface px-5 py-6 text-center",
          "hover:-translate-y-0.5"
        )}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {bento.cost.eyebrow}
        </span>
        <span className="font-sora text-[length:clamp(0.95rem,1.5vw,1.1rem)] font-bold leading-tight tracking-[-0.02em] text-ink">
          {bento.cost.title}
        </span>
        <span className="text-xs leading-snug text-muted">
          {bento.cost.note}
        </span>
      </div>

      <div
        className={cn(
          tileBase,
          "col-span-3 rounded-[var(--r-xl)] border border-hairline bg-canvas",
          "hover:-translate-y-0.5"
        )}
      >
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
                  line.trim().startsWith("//") ? "block text-muted" : "block"
                }
              >
                {line}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
