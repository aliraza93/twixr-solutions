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

const VIEW = { w: 640, h: 520, cx: 320, cy: 248, rx: 248, ry: 168 };
/** Clockwise degrees from top — Discover, Design, Build, Ship, Scale */
const ANGLES = [0, 90, 135, 225, 270];

function ellipsePoint(degFromTop: number) {
  const rad = ((degFromTop - 90) * Math.PI) / 180;
  return {
    x: VIEW.cx + VIEW.rx * Math.cos(rad),
    y: VIEW.cy + VIEW.ry * Math.sin(rad),
  };
}

function nearestIndex(deg: number) {
  let best = 0;
  let bestDist = 999;
  ANGLES.forEach((angle, i) => {
    const delta = Math.abs(deg - angle) % 360;
    const dist = Math.min(delta, 360 - delta);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

function useOrbitMode() {
  const [fallback, setFallback] = useState(true);

  useEffect(() => {
    const apply = () => {
      setFallback(
        window.matchMedia("(max-width: 1023px)").matches ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    };
    apply();
    const mobile = window.matchMedia("(max-width: 1023px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    mobile.addEventListener("change", apply);
    reduce.addEventListener("change", apply);
    return () => {
      mobile.removeEventListener("change", apply);
      reduce.removeEventListener("change", apply);
    };
  }, []);

  return fallback;
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
    <div key={panelKey} className="orbit-panel">
      <p className="font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em] text-pine">
        {panel.index} · {node.label}
      </p>
      <h3 className="mt-3 font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em] text-ink">
        {panel.logo}
      </h3>
      <p className="mt-2 font-medium text-pine">{panel.tagline}</p>
      <p className="mt-3 max-w-[42ch] text-[length:var(--fs-body)] leading-relaxed text-muted">
        {panel.desc}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {panel.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-pill border border-hairline px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-8 flex gap-10">
        {panel.stats.map((stat) => (
          <div key={stat.unit}>
            <p className="font-sora text-[length:var(--fs-h2)] font-extrabold leading-none tracking-[-0.02em] text-ink">
              {stat.value}
            </p>
            <p className="mt-2 font-mono text-[length:var(--fs-eyebrow)] uppercase tracking-[0.18em] text-muted">
              {stat.unit}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-8">
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
              "font-mono text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-[var(--dur-fast)]",
              i === active ? "text-lime-deep" : "text-muted hover:text-ink"
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

export function OrbitDiagram({
  hub,
  nodes,
  autoRotate = true,
  rotateMs = 12000,
  className,
}: OrbitDiagramProps) {
  const fallback = useOrbitMode();
  const liveId = "orbit-live";
  const stageRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
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

  const snapTo = useCallback(
    (index: number, pause = true) => {
      pausedRef.current = pause;
      tRef.current = ANGLES[index] / 360;
      setActiveIndex(index);
      const dot = dotRef.current;
      if (!dot) return;
      const { x, y } = ellipsePoint(ANGLES[index]);
      dot.style.left = `${(x / VIEW.w) * 100}%`;
      dot.style.top = `${(y / VIEW.h) * 100}%`;
    },
    [setActiveIndex]
  );

  useEffect(() => {
    const stage = stageRef.current;
    const path = pathRef.current;
    if (!stage || fallback) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        stage.classList.add("is-inview");
        if (path) {
          const len = path.getTotalLength();
          path.style.strokeDasharray = "8 12";
          path.style.strokeDashoffset = `${len}`;
          requestAnimationFrame(() => {
            path.style.transition = "stroke-dashoffset 1.1s var(--ease-out)";
            path.style.strokeDashoffset = "0";
          });
        }
        window.setTimeout(() => setDrawn(true), 700);
        observer.disconnect();
      },
      { threshold: 0.2 }
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [fallback]);

  useEffect(() => {
    if (fallback || !autoRotate || !drawn) return;
    const dot = dotRef.current;
    if (!dot) return;

    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!pausedRef.current && document.visibilityState === "visible") {
        tRef.current = (tRef.current + dt / rotateMs) % 1;
        const deg = tRef.current * 360;
        const { x, y } = ellipsePoint(deg);
        dot.style.left = `${(x / VIEW.w) * 100}%`;
        dot.style.top = `${(y / VIEW.h) * 100}%`;
        const next = nearestIndex(deg);
        if (next !== activeRef.current) setActiveIndex(next);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoRotate, drawn, fallback, rotateMs, setActiveIndex]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const dir = event.key === "ArrowRight" ? 1 : -1;
    const next = (activeRef.current + dir + nodes.length) % nodes.length;
    snapTo(next);
  };

  const liveText = `${nodes[active].label}. ${nodes[active].panel.tagline}`;

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
                  size="sm"
                  label={node.label}
                  active={selected}
                  aria-pressed={selected}
                  onClick={() => setActiveIndex(i)}
                  className="relative z-[1] flex-row gap-4 self-start text-left sm:gap-5 [&_span:last-child]:mt-0 [&_span:last-child]:text-left"
                >
                  {node.icon}
                </IconNode>
                {selected && (
                  <div className="mb-8 mt-5 sm:ml-[4.5rem]">
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
            className="relative col-span-12 lg:col-span-7"
            role="radiogroup"
            aria-label="Delivery cycle"
            onKeyDown={onKeyDown}
            onPointerLeave={() => {
              pausedRef.current = false;
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                pausedRef.current = false;
              }
            }}
          >
            <svg
              viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
              className="h-auto w-full"
              aria-hidden
            >
              <defs>
                <linearGradient id="orbit-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--d-mint)" />
                  <stop offset="100%" stopColor="var(--d-lime)" />
                </linearGradient>
              </defs>
              <path
                ref={pathRef}
                className="orbit-path"
                d={`M ${VIEW.cx} ${VIEW.cy - VIEW.ry} A ${VIEW.rx} ${VIEW.ry} 0 1 1 ${VIEW.cx} ${VIEW.cy + VIEW.ry} A ${VIEW.rx} ${VIEW.ry} 0 1 1 ${VIEW.cx} ${VIEW.cy - VIEW.ry}`}
                fill="none"
                stroke="url(#orbit-grad)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            <div
              className="orbit-hub pointer-events-none absolute flex flex-col items-center justify-center rounded-full border border-hairline bg-canvas/40 text-center backdrop-blur-[2px]"
              style={{
                width: "7.25rem",
                height: "7.25rem",
                left: `${(VIEW.cx / VIEW.w) * 100}%`,
                top: `${(VIEW.cy / VIEW.h) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-lime-deep">
                {hub.label}
              </span>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {hub.sub}
              </span>
            </div>

            <div
              ref={dotRef}
              className="orbit-dot pointer-events-none absolute z-20 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime"
              style={{
                left: `${(ellipsePoint(0).x / VIEW.w) * 100}%`,
                top: `${(ellipsePoint(0).y / VIEW.h) * 100}%`,
              }}
              aria-hidden
            />

            {nodes.map((node, i) => {
              const { x, y } = ellipsePoint(ANGLES[i]);
              const selected = i === active;
              return (
                <IconNode
                  key={node.id}
                  as="button"
                  size="sm"
                  label={node.label}
                  active={selected}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  onFocus={() => snapTo(i)}
                  onClick={() => snapTo(i)}
                  className={cn(
                    "absolute z-10",
                    selected ? "opacity-100" : "opacity-60 hover:opacity-100"
                  )}
                  style={{
                    left: `${(x / VIEW.w) * 100}%`,
                    top: `${(y / VIEW.h) * 100}%`,
                    transform: "translate(-50%, -32px)",
                  }}
                >
                  {node.icon}
                </IconNode>
              );
            })}
          </div>

          <div className="col-span-12 min-h-[22rem] lg:col-span-5">
            <DetailPanel node={nodes[active]} panelKey={nodes[active].id} />
          </div>
        </div>

        <HorizontalStepper nodes={nodes} active={active} onSelect={snapTo} />
      </div>
    </div>
  );
}
