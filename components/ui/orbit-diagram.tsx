"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconNode } from "@/components/ui/icon-node";
import { cn } from "@/lib/utils";

export type OrbitStat = { value: string; unit: string };

export type OrbitPanel = {
  index: string;
  logo: string;
  tagline: string;
  desc: string;
  tags: string[];
  stats: OrbitStat[];
  href: string;
  linkLabel?: string;
};

export type OrbitNode = {
  id: string;
  label: string;
  icon: ReactNode;
  panel: OrbitPanel;
};

type OrbitDiagramProps = {
  hub: { label: string; sub: string };
  nodes: OrbitNode[];
  autoRotate?: boolean;
  rotateMs?: number;
  className?: string;
};

/** Math degrees: 0 = 3 o'clock, clockwise as angle increases (y grows down). */
const ANGLES = [-90, -18, 54, 126, 198] as const;
/** Radius as % of the square stage - leaves room for 76px nodes + labels. */
const R = 40.5;
const TRACK_DASH = "4 6";

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function normalize(deg: number) {
  return ((deg % 360) + 360) % 360;
}

function circlePoint(deg: number, radius = R) {
  const rad = toRad(deg);
  return {
    x: 50 + radius * Math.cos(rad),
    y: 50 + radius * Math.sin(rad),
  };
}

function angleToT(deg: number) {
  return normalize(deg + 90) / 360;
}

function nearestIndex(deg: number) {
  const d = normalize(deg);
  let best = 0;
  let bestDist = 999;
  ANGLES.forEach((angle, i) => {
    const delta = Math.abs(d - normalize(angle));
    const dist = Math.min(delta, 360 - delta);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

function useMobileFallback() {
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setFallback(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return fallback;
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return reduce;
}

function DetailPanel({
  node,
  panelKey,
}: {
  node: OrbitNode;
  panelKey: string;
}) {
  const { panel } = node;
  return (
    <div key={panelKey} className="orbit-panel text-left">
      <p className="font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em] text-lime">
        {panel.index} · {node.label}
      </p>
      <h3 className="mt-3 font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em] text-ink">
        {panel.logo}
      </h3>
      <p className="mt-2 font-medium text-pine">{panel.tagline}</p>
      <p className="mt-3 max-w-[42ch] text-[length:var(--fs-body)] leading-relaxed text-muted">
        {panel.desc}
      </p>
      <div className="mt-5 flex flex-wrap justify-start gap-2">
        {panel.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-pill border border-hairline px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-6 flex justify-start gap-8">
        {panel.stats.map((stat) => (
          <div key={stat.unit} className="text-left">
            <p className="font-sora text-[length:var(--fs-h2)] font-extrabold leading-none tracking-[-0.02em] text-ink">
              {stat.value}
            </p>
            <p className="mt-1.5 font-mono text-[length:var(--fs-eyebrow)] uppercase tracking-[0.18em] text-muted">
              {stat.unit}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-7">
        <Button variant="text" asChild>
          <Link href={panel.href}>{panel.linkLabel ?? "See the process"}</Link>
        </Button>
      </div>
    </div>
  );
}

function HorizontalStepper({
  nodes,
  active,
  onSelect,
}: {
  nodes: OrbitNode[];
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <ol className="mt-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
      {nodes.map((node, i) => (
        <li key={node.id} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              "cursor-pointer font-mono text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-[var(--dur-fast)]",
              i === active ? "text-lime" : "text-muted hover:text-ink"
            )}
          >
            {node.label}
          </button>
          {i < nodes.length - 1 && (
            <span aria-hidden className="font-mono text-muted-2">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function OrbitNodeButton({
  node,
  selected,
  style,
  onSelect,
}: {
  node: OrbitNode;
  selected: boolean;
  style: { left: string; top: string };
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      data-cursor
      onFocus={onSelect}
      onPointerEnter={onSelect}
      onClick={onSelect}
      className="orbit-node absolute z-10 cursor-pointer"
      style={style}
    >
      <span
        className={cn(
          "orbit-node__ring flex h-[76px] w-[76px] items-center justify-center rounded-full border-[1.5px] bg-transparent transition-[border-color,box-shadow,color] duration-[var(--dur)] ease-[var(--ease-out)] [&>svg]:h-7 [&>svg]:w-7 [&>svg]:stroke-[1.5]",
          selected
            ? "border-lime text-lime [box-shadow:var(--shadow-node)]"
            : "border-hairline text-muted"
        )}
      >
        {node.icon}
      </span>
      <span
        className={cn(
          "orbit-node__label font-mono text-[11px] font-medium uppercase tracking-[0.18em]",
          selected ? "text-lime" : "text-muted"
        )}
      >
        {node.label}
      </span>
    </button>
  );
}

export function OrbitDiagram({
  hub,
  nodes,
  autoRotate = true,
  rotateMs = 16000,
  className,
}: OrbitDiagramProps) {
  const fallback = useMobileFallback();
  const reduce = useReducedMotion();
  const liveId = "orbit-live";
  const stageRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGCircleElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const tRef = useRef(0);
  const pausedRef = useRef(false);
  const [active, setActive] = useState(0);
  const [drawn, setDrawn] = useState(false);

  const setActiveIndex = useCallback((index: number) => {
    activeRef.current = index;
    setActive(index);
  }, []);

  const placeDot = useCallback((deg: number) => {
    const dot = dotRef.current;
    if (!dot) return;
    const { x, y } = circlePoint(deg);
    dot.style.left = `${x}%`;
    dot.style.top = `${y}%`;
  }, []);

  const snapTo = useCallback(
    (index: number, pause = true) => {
      pausedRef.current = pause;
      tRef.current = angleToT(ANGLES[index]);
      setActiveIndex(index);
      placeDot(ANGLES[index]);
    },
    [placeDot, setActiveIndex]
  );

  useEffect(() => {
    const stage = stageRef.current;
    const path = pathRef.current;
    if (!stage || fallback) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        stage.classList.add("is-inview");
        if (path && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          const len = path.getTotalLength();
          path.style.strokeDasharray = `${len}`;
          path.style.strokeDashoffset = `${len}`;
          requestAnimationFrame(() => {
            path.style.transition = "stroke-dashoffset 1.1s var(--ease-out)";
            path.style.strokeDashoffset = "0";
            window.setTimeout(() => {
              path.style.transition = "none";
              path.style.strokeDasharray = TRACK_DASH;
              path.style.strokeDashoffset = "0";
            }, 1100);
          });
        } else if (path) {
          path.style.strokeDasharray = TRACK_DASH;
          path.style.strokeDashoffset = "0";
        }
        window.setTimeout(() => setDrawn(true), reduce ? 0 : 700);
        observer.disconnect();
      },
      { threshold: 0.2 }
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [fallback, reduce]);

  useEffect(() => {
    if (fallback || !autoRotate || !drawn || reduce) {
      placeDot(ANGLES[activeRef.current]);
      return;
    }
    const dot = dotRef.current;
    if (!dot) return;

    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!pausedRef.current && document.visibilityState === "visible") {
        tRef.current = (tRef.current + dt / rotateMs) % 1;
        const deg = -90 + tRef.current * 360;
        placeDot(deg);
        const next = nearestIndex(deg);
        if (next !== activeRef.current) setActiveIndex(next);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoRotate, drawn, fallback, placeDot, reduce, rotateMs, setActiveIndex]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const dir = event.key === "ArrowRight" ? 1 : -1;
    const next = (activeRef.current + dir + nodes.length) % nodes.length;
    snapTo(next);
  };

  const liveText = `${nodes[active].panel.index} · ${nodes[active].label}. ${nodes[active].panel.tagline}`;
  const start = circlePoint(ANGLES[0]);

  return (
    <div className={cn("orbit-diagram", className)}>
      <p id={liveId} className="sr-only" aria-live="polite" aria-atomic="true">
        {liveText}
      </p>

      <div className="orbit-fallback">
        <ol className="relative mx-auto max-w-xl">
          {nodes.map((node, i) => {
            const selected = i === active;
            return (
              <li key={node.id} className="relative flex flex-col">
                {i < nodes.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-8 top-16 z-0 h-[calc(100%-2rem)] w-px bg-hairline"
                  />
                )}
                <IconNode
                  as="button"
                  size="md"
                  label={node.label}
                  active={selected}
                  aria-pressed={selected}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    "relative z-[1] flex-row gap-4 self-start text-left sm:gap-5 [&_span:last-child]:mt-0 [&_span:last-child]:text-left",
                    !selected &&
                      "[&_.icon-node__ring]:border-hairline [&_.icon-node__ring]:text-muted [&_.icon-node__ring]:shadow-none"
                  )}
                >
                  {node.icon}
                </IconNode>
                {selected && (
                  <div className="mb-8 mt-5 sm:ml-[5.5rem]">
                    <DetailPanel node={node} panelKey={`${node.id}-m`} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="orbit-desktop">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div
            ref={stageRef}
            className="orbit-stage relative col-span-12 mx-auto lg:col-span-7 lg:mx-0"
            role="radiogroup"
            aria-label="Delivery cycle"
            onKeyDown={onKeyDown}
            onPointerLeave={() => {
              if (!reduce) pausedRef.current = false;
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                if (!reduce) pausedRef.current = false;
              }
            }}
          >
            <svg
              viewBox="0 0 100 100"
              className="orbit-ring h-full w-full"
              aria-hidden
            >
              <circle
                ref={pathRef}
                className="orbit-path"
                cx="50"
                cy="50"
                r={R}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={TRACK_DASH}
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <div className="orbit-hub pointer-events-none absolute flex flex-col items-center justify-center rounded-full border border-hairline bg-canvas/40 text-center">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-lime">
                {hub.label}
              </span>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {hub.sub}
              </span>
            </div>

            <div
              ref={dotRef}
              className="orbit-dot pointer-events-none absolute z-20 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime"
              style={{ left: `${start.x}%`, top: `${start.y}%` }}
              aria-hidden
            />

            {nodes.map((node, i) => {
              const { x, y } = circlePoint(ANGLES[i]);
              return (
                <OrbitNodeButton
                  key={node.id}
                  node={node}
                  selected={i === active}
                  onSelect={() => snapTo(i)}
                  style={{ left: `${x}%`, top: `${y}%` }}
                />
              );
            })}
          </div>

          <div className="col-span-12 lg:col-span-5">
            <DetailPanel node={nodes[active]} panelKey={nodes[active].id} />
          </div>
        </div>

        <HorizontalStepper nodes={nodes} active={active} onSelect={snapTo} />
      </div>
    </div>
  );
}
