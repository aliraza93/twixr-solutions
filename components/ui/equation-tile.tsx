import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EquationTileVariant = "default" | "result";

type EquationTileProps = {
  children: ReactNode;
  label: string;
  variant?: EquationTileVariant;
  className?: string;
  style?: CSSProperties;
};

export function EquationTile({
  children,
  label,
  variant = "default",
  className,
  style,
}: EquationTileProps) {
  const result = variant === "result";

  return (
    <figure
      className={cn("eq-tile eq-reveal relative z-[1] m-0 flex flex-col items-center", className)}
      style={style}
      data-variant={variant}
    >
      <div
        className={cn(
          "eq-tile__face flex size-[132px] items-center justify-center rounded-lg border bg-canvas",
          result
            ? "eq-tile__face--result border-lime text-lime-deep"
            : "border-hairline text-pine"
        )}
      >
        <span className="[&>svg]:h-8 [&>svg]:w-8 [&>svg]:stroke-[1.5]">{children}</span>
      </div>
      <figcaption
        className={cn(
          "mt-4 max-w-[12ch] text-center font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase leading-relaxed tracking-[0.18em]",
          result ? "text-lime-ink" : "text-ink"
        )}
      >
        {label}
      </figcaption>
    </figure>
  );
}
