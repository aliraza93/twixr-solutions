"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { ConnectorLine } from "@/components/ui/connector-line";
import { useConnectorProgress } from "@/hooks/use-connector-progress";

export type ProgressTimelineNode = {
  index: string;
  title: string;
  description: string;
};

type ProgressTimelineProps = {
  nodes: ProgressTimelineNode[];
  className?: string;
  autoPlayOnEnter?: boolean;
  durationMs?: number;
  once?: boolean;
};

export function ProgressTimeline({
  nodes,
  className,
  autoPlayOnEnter = true,
  durationMs = 2500,
  once = true,
}: ProgressTimelineProps) {
  const { ref, activeCount, finale } = useConnectorProgress({
    stationCount: nodes.length,
    durationMs,
    threshold: 0.35,
    autoPlayOnEnter,
    once,
  });

  return (
    <div
      ref={ref}
      className={cn("progress-timeline relative", className)}
      style={{ "--p": "0%" } as CSSProperties}
    >
      <ConnectorLine className="progress-timeline__track" />

      <ol className="progress-timeline__nodes">
        {nodes.map((node, i) => {
          const on = i < activeCount;
          const isFinale = finale && i === nodes.length - 1;
          return (
            <li key={node.index} className="progress-timeline__item">
              <span
                className={cn(
                  "progress-timeline__mark flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] font-mono text-[11px] font-medium tracking-[0.14em] transition-[border-color,color,box-shadow] duration-[var(--dur)] ease-[var(--ease-out)]",
                  on
                    ? "border-pine bg-pine-tint text-pine"
                    : "border-hairline bg-canvas text-muted",
                  isFinale && "progress-timeline__mark--finale"
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
