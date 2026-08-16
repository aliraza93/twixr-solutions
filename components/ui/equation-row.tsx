"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EquationTile, type EquationTileVariant } from "@/components/ui/equation-tile";
import { IconNode } from "@/components/ui/icon-node";

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
};

function Operator({ glyph, index }: { glyph: "+" | "="; index: number }) {
  return (
    <span
      className="eq-op-wrap eq-reveal relative z-[1] flex h-8 items-center justify-center md:h-[132px]"
      style={{ "--i": index } as CSSProperties}
      aria-hidden
    >
      <span className="eq-op font-sora text-[length:var(--fs-h2)] font-bold leading-none text-muted">
        {glyph}
      </span>
    </span>
  );
}

function SquareNode({
  item,
  variant,
  index,
}: {
  item: EquationItem;
  variant: EquationTileVariant;
  index: number;
}) {
  return (
    <EquationTile
      label={item.label}
      variant={variant}
      style={{ "--i": index } as CSSProperties}
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
      className="eq-reveal relative z-[1]"
      style={{ "--i": index } as CSSProperties}
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

export function EquationRow({
  a,
  b,
  c,
  shape = "square",
  className,
}: EquationRowProps) {
  const Node = shape === "circle" ? CircleNode : SquareNode;

  return (
    <div
      className={cn(
        "eq-row relative flex w-full flex-col items-center gap-5 md:flex-row md:items-start md:justify-center md:gap-[clamp(16px,3vw,40px)]",
        className
      )}
      role="group"
      aria-label={`${a.label} plus ${b.label} equals ${c.label}`}
    >
      <span className="eq-row__rail" aria-hidden />
      <Node item={a} variant="default" index={1} />
      <Operator glyph="+" index={2} />
      <Node item={b} variant="default" index={3} />
      <Operator glyph="=" index={4} />
      <Node item={c} variant="result" index={5} />
    </div>
  );
}
