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

function Operator({
  glyph,
  index,
  circled,
}: {
  glyph: "+" | "=";
  index: number;
  circled?: boolean;
}) {
  return (
    <span
      className={cn(
        "eq-op-wrap eq-reveal relative z-[1] flex h-8 items-center justify-center",
        circled ? "md:h-24" : "md:h-[132px]"
      )}
      style={{ "--i": index } as CSSProperties}
      aria-hidden
    >
      <span
        className={cn(
          "eq-op font-sora font-bold leading-none text-muted",
          circled
            ? "eq-op--node text-base"
            : "text-[length:var(--fs-h2)]"
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

export function EquationRow({
  a,
  b,
  c,
  shape = "square",
  className,
}: EquationRowProps) {
  const Node = shape === "circle" ? CircleNode : SquareNode;
  const circled = shape === "circle";

  return (
    <div
      className={cn(
        "eq-row relative flex w-full flex-col items-center gap-5 md:flex-row md:items-start md:justify-center md:gap-[clamp(16px,3vw,40px)]",
        circled && "eq-row--circle",
        className
      )}
      role="group"
      aria-label={`${a.label} plus ${b.label} equals ${c.label}`}
    >
      <span className="eq-row__rail" aria-hidden />
      <Node item={a} variant="default" index={1} />
      <Operator glyph="+" index={2} circled={circled} />
      <Node
        item={b}
        variant={circled ? "result" : "default"}
        index={3}
      />
      <Operator glyph="=" index={4} circled={circled} />
      <Node
        item={c}
        variant={circled ? "default" : "result"}
        index={5}
      />
    </div>
  );
}
