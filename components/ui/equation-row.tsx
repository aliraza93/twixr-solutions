"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ConnectorLine } from "@/components/ui/connector-line";
import { EquationTile, type EquationTileVariant } from "@/components/ui/equation-tile";
import { IconNode } from "@/components/ui/icon-node";
import {
  midStations,
  useConnectorProgress,
} from "@/hooks/use-connector-progress";

export type EquationItem = {
  icon: ReactNode;
  label: string;
  sublabel?: string;
};

type EquationRowProps = {
  a: EquationItem;
  b: EquationItem;
  c: EquationItem;
  shape?: "square" | "circle";
  className?: string;
  durationMs?: number;
  once?: boolean;
  onFinale?: () => void;
};

const STATIONS = 5;

function Operator({
  glyph,
  index,
  circled,
  active,
}: {
  glyph: "+" | "=";
  index: number;
  circled?: boolean;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "eq-op-wrap relative z-[1] flex h-8 items-center justify-center",
        circled ? "eq-reveal md:h-24" : "md:h-[132px]",
        active && "is-active"
      )}
      style={{ "--i": index } as CSSProperties}
      aria-hidden
    >
      <span
        className={cn(
          "eq-op font-sora font-bold leading-none text-muted",
          circled ? "eq-op--node text-base" : "text-[length:var(--fs-h2)]"
        )}
      >
        {glyph}
      </span>
    </span>
  );
}

function SquareNode({
  item,
  variant,
  active,
  shine,
}: {
  item: EquationItem;
  variant: EquationTileVariant;
  active: boolean;
  shine: boolean;
}) {
  return (
    <EquationTile
      label={item.label}
      variant={variant}
      active={active}
      shine={shine}
    >
      {item.icon}
    </EquationTile>
  );
}

function CircleNode({
  item,
  variant,
  index,
}: {
  item: EquationItem;
  variant: EquationTileVariant;
  index: number;
}) {
  return (
    <div
      className={cn(
        "eq-reveal relative z-[1]",
        variant !== "result" && "md:pt-3"
      )}
      style={{ "--i": index } as CSSProperties}
      {...(variant === "result" ? { "data-eq-result": true } : {})}
    >
      <IconNode
        label={item.label}
        sublabel={item.sublabel}
        accent={variant === "result" ? "lime" : "pine"}
        size={variant === "result" ? "lg" : "md"}
      >
        {item.icon}
      </IconNode>
    </div>
  );
}

function PlayEquationRow({
  a,
  b,
  c,
  className,
  durationMs = 1800,
  once = true,
  onFinale,
}: Omit<EquationRowProps, "shape">) {
  const { ref, activeCount, finale } = useConnectorProgress({
    stationCount: STATIONS,
    durationMs,
    threshold: 0.4,
    once,
    stationAt: midStations,
    onFinale,
  });

  return (
    <div
      ref={ref}
      className={cn(
        "eq-row eq-row--play relative flex w-full flex-col items-center gap-5 md:flex-row md:items-start md:justify-center md:gap-[clamp(16px,3vw,40px)]",
        className
      )}
      style={{ "--p": "0%" } as CSSProperties}
      role="group"
      aria-label={`${a.label} plus ${b.label} equals ${c.label}`}
    >
      <ConnectorLine detachDot />
      <SquareNode
        item={a}
        variant="default"
        active={activeCount >= 1}
        shine={false}
      />
      <Operator glyph="+" index={2} active={activeCount >= 2} />
      <SquareNode
        item={b}
        variant="default"
        active={activeCount >= 3}
        shine={false}
      />
      <Operator glyph="=" index={4} active={activeCount >= 4} />
      <SquareNode
        item={c}
        variant="result"
        active={activeCount >= 5}
        shine={finale}
      />
    </div>
  );
}

export function EquationRow({
  a,
  b,
  c,
  shape = "square",
  className,
  durationMs = 1800,
  once = true,
  onFinale,
}: EquationRowProps) {
  if (shape === "circle") {
    return (
      <div
        className={cn(
          "eq-row eq-row--circle relative flex w-full flex-col items-center gap-5 md:flex-row md:items-start md:justify-center md:gap-[clamp(16px,3vw,40px)]",
          className
        )}
        role="group"
        aria-label={`${a.label} plus ${b.label} equals ${c.label}`}
      >
        <span className="eq-row__rail" aria-hidden />
        <CircleNode item={a} variant="default" index={1} />
        <Operator glyph="+" index={2} circled />
        <CircleNode item={b} variant="result" index={3} />
        <Operator glyph="=" index={4} circled />
        <CircleNode item={c} variant="default" index={5} />
      </div>
    );
  }

  return (
    <PlayEquationRow
      a={a}
      b={b}
      c={c}
      className={className}
      durationMs={durationMs}
      once={once}
      onFinale={onFinale}
    />
  );
}
