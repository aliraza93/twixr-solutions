"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

export type ProgressTimelineNode = {
  index: string;
  title: string;
  description: string;
};

type ProgressTimelineProps = {
  nodes: ProgressTimelineNode[];
  className?: string;
};

let registered = false;

function ensureGsap() {
  if (typeof window === "undefined" || registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export function ProgressTimeline({ nodes, className }: ProgressTimelineProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const last = nodes.length;

    const apply = (progress: number) => {
      const p = Math.min(1, Math.max(0, progress));
      root.style.setProperty("--p", `${p * 100}%`);
      let count = 0;
      for (let i = 0; i < last; i++) {
        if (p + 0.001 >= i / Math.max(1, last - 1)) count += 1;
      }
      if (count !== activeRef.current) {
        activeRef.current = count;
        setActiveCount(count);
      }
    };

    if (reduce) {
      apply(1);
      return;
    }

    ensureGsap();
    apply(0);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root,
        start: "top 75%",
        end: "bottom 45%",
        scrub: 0.7,
        onUpdate: (self) => apply(self.progress),
      });
    }, root);

    return () => ctx.revert();
  }, [nodes.length]);

  const lastActive = activeCount >= nodes.length;

  return (
    <div
      ref={rootRef}
      className={cn("progress-timeline relative", className)}
      style={{ "--p": "0%" } as CSSProperties}
    >
      <div className="progress-timeline__track" aria-hidden>
        <div className="progress-timeline__fill" />
        <div className="progress-timeline__dot" />
      </div>

      <ol className="progress-timeline__nodes">
        {nodes.map((node, i) => {
          const on = i < activeCount;
          const finale = lastActive && i === nodes.length - 1;
          return (
            <li key={node.index} className="progress-timeline__item">
              <span
                className={cn(
                  "progress-timeline__mark flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] font-mono text-[11px] font-medium tracking-[0.14em] transition-[border-color,color,box-shadow] duration-[var(--dur)] ease-[var(--ease-out)]",
                  on
                    ? "border-pine bg-pine-tint text-pine"
                    : "border-hairline bg-canvas text-muted",
                  finale && "progress-timeline__mark--finale"
                )}
              >
                {node.index}
              </span>
              <h3 className="mt-1 font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em] text-ink lg:mt-4">
                {node.title}
              </h3>
              <p className="mt-2 max-w-[28ch] font-mono text-[12px] leading-relaxed text-muted lg:max-w-none">
                {node.description}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
