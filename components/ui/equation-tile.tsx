import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EquationTileVariant = "default" | "result";

type EquationTileProps = {
  children: ReactNode;
  label: string;
  variant?: EquationTileVariant;
  active?: boolean;
  shine?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function EquationTile({
  children,
  label,
  variant = "default",
  active = false,
  shine = false,
  className,
  style,
}: EquationTileProps) {
  return (
    <figure
      className={cn(
        "eq-tile relative z-[1] m-0 flex flex-col items-center",
        active && "is-active",
        shine && "is-shine",
        className
      )}
      style={style}
      data-variant={variant}
    >
      <div
        className={cn(
          "eq-tile__face flex size-[132px] items-center justify-center rounded-lg border bg-canvas text-pine",
          shine && "eq-tile__face--result"
        )}
      >
        <span className="[&>svg]:h-8 [&>svg]:w-8 [&>svg]:stroke-[1.5]">{children}</span>
      </div>
      <figcaption
        className={cn(
          "mt-4 max-w-[12ch] text-center font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase leading-relaxed tracking-[0.18em]",
          shine ? "text-lime-ink" : "text-ink"
        )}
      >
        {label}
      </figcaption>
    </figure>
  );
}
