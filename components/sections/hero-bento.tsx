"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroContent } from "@/lib/cms/types";

/**
 * The hero's bento cluster.
 *
 * Pinwheel structure from the OpenBank shot by Dipa Inhouse; everything else
 * is this site's own vocabulary, turned up.
 *
 * The one decisive move is an interlock. The proof node is not laid on top of
 * the result card, it is set INTO it: the card is genuinely masked away where
 * the node sits (.hero-bite), so the two shapes occupy one another's space
 * instead of stacking. The bite and the node derive from the same three CSS
 * variables, so they cannot drift apart at any viewport.
 *
 * The second half of the move is that the tiles stopped being boxes with text
 * in them. Each one is a small instrument: the query collapse is drawn as a
 * dense field of bars resolving into six, the cloud cost as a falling line.
 * Strip the copy out and the cluster still says "a lot became a little" and
 * "this went down", which is the test a bold section has to pass.
 *
 * Everything else is deliberately quieted so the move stays legible.
 */

const MAX_TILT = 5;

/**
 * Fixed bar heights. Deterministic on purpose: a random field would differ
 * between the server and client render and break hydration.
 */
const DENSE_BARS = [
  38, 52, 31, 64, 45, 72, 29, 58, 41, 67, 35, 49, 61, 33, 55, 43, 69, 37, 51,
  27, 59, 47,
] as const;
const RESOLVED_BARS = [74, 88, 62, 95, 70, 83] as const;

const COST_LINE = "M2,30 L16,26 L30,31 L44,22 L58,24 L72,14 L86,16 L100,6";

function canTilt() {
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(hover: hover)").matches
  );
}

type Bento = NonNullable<HeroContent["bento"]>;

const tile =
  "hero-tile relative flex flex-col transition-[transform,box-shadow] duration-[var(--dur)] ease-[var(--ease-out)] hover:-translate-y-0.5";

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
      className="hero-bento flex w-full flex-col gap-[var(--bgap)]"
      style={{ "--rx": "0deg", "--ry": "0deg" } as React.CSSProperties}
    >
      <div className="flex h-[var(--row)] gap-[var(--bgap)]">
      {/* The result, as an instrument. A dense field of queries resolving
          into six, with the card cut away where the proof node sits. */}
      <div
        className={cn(
          tile,
          "hero-bite min-w-0 flex-1 justify-between rounded-[var(--r-xl)] bg-ink p-5 sm:p-6"
        )}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-d-lime">
          {bento.result.eyebrow}
        </span>

        <div
          className="flex h-[38%] items-end gap-[3px] pr-[18%] sm:gap-1"
          aria-hidden
        >
          {DENSE_BARS.map((h, i) => (
            <span
              key={`d${i}`}
              className="hero-bar w-[2px] shrink-0 rounded-[1px] bg-d-lime/25"
              style={{ height: `${h}%`, "--b": i } as React.CSSProperties}
            />
          ))}
          <span className="mx-1 h-px w-3 shrink-0 self-center bg-d-muted/40 sm:mx-1.5" />
          {RESOLVED_BARS.map((h, i) => (
            <span
              key={`r${i}`}
              className="hero-bar w-[5px] shrink-0 rounded-[2px] bg-d-lime sm:w-[7px]"
              style={
                {
                  height: `${h}%`,
                  "--b": DENSE_BARS.length + i + 2,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <p className="text-sm leading-snug text-d-muted">
          <span className="font-sora text-base font-bold text-d-muted line-through decoration-d-muted/50 tabular-nums">
            {bento.result.from}
          </span>{" "}
          <span className="font-sora text-lg font-extrabold text-d-text tabular-nums">
            {bento.result.to}
          </span>{" "}
          {bento.result.caption}
        </p>
      </div>

      {/* The node sits IN the cut, not on top of it. */}
        <div className="relative w-[var(--track)] shrink-0">
        <span
          className="hero-junction rounded-full bg-lime"
          aria-hidden
        />
        <div className="hero-node flex flex-col items-center justify-center gap-1 rounded-full border border-hairline bg-accent-tint text-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine">
            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} aria-hidden />
          </span>
          <span className="font-sora text-[length:clamp(1.5rem,2.8vw,2rem)] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
            {bento.proof.value}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
            {bento.proof.label}
          </span>
          <span className="px-[22%] text-[11px] leading-snug text-muted">
            {bento.proof.note}
          </span>
        </div>
      </div>

      </div>

      <div className="flex h-[var(--row)] gap-[var(--bgap)]">
        {/* Cost, as a falling line. Same track width as the node above it. */}
        <div
          className={cn(
            tile,
            "w-[var(--track)] shrink-0 items-center justify-center gap-2 rounded-full border border-hairline bg-surface px-5 py-6 text-center"
          )}
        >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {bento.cost.eyebrow}
        </span>
        <svg
          viewBox="0 0 102 36"
          className="h-8 w-[72%]"
          fill="none"
          aria-hidden
          preserveAspectRatio="none"
        >
          <path
            d={COST_LINE}
            className="hero-spark"
            stroke="var(--pine)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
          />
          <circle cx="100" cy="6" r="3.5" fill="var(--lime-deep)" />
        </svg>
        <span className="font-sora text-[length:clamp(0.9rem,1.35vw,1.05rem)] font-bold leading-tight tracking-[-0.02em] text-ink">
          {bento.cost.title}
        </span>
        <span className="text-[11px] leading-snug text-muted">
          {bento.cost.note}
        </span>
      </div>

      {/* Quieted on purpose: with two instruments running, a third loud tile
          would flatten the whole cluster again. */}
      <div
        className={cn(
          tile,
          "min-w-0 flex-1 rounded-[var(--r-xl)] border border-hairline bg-canvas"
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
        <pre className="flex flex-1 flex-col justify-center overflow-hidden px-4 py-3 font-mono text-[11px] leading-[1.85] text-ink-soft sm:text-[12.5px]">
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
    </div>
  );
}
