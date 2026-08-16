import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconNodeAccent = "pine" | "lime";
type IconNodeSize = "md" | "lg";

type IconNodeProps = {
  children: ReactNode;
  label: string;
  sublabel?: string;
  accent?: IconNodeAccent;
  size?: IconNodeSize;
  className?: string;
};

const SIZE: Record<IconNodeSize, string> = {
  md: "h-[72px] w-[72px]",
  lg: "h-24 w-24",
};

export function IconNode({
  children,
  label,
  sublabel,
  accent = "pine",
  size = "md",
  className,
}: IconNodeProps) {
  const lime = accent === "lime";

  return (
    <figure className={cn("flex flex-col items-center text-center", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full border-[1.5px] bg-transparent",
          SIZE[size],
          lime
            ? "border-lime-deep text-lime-deep shadow-lime"
            : "border-pine text-pine [box-shadow:var(--shadow-node)]"
        )}
      >
        <span className="[&>svg]:h-8 [&>svg]:w-8 [&>svg]:stroke-[1.5]">{children}</span>
      </div>
      <figcaption className="mt-4 font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em]">
        <span className={cn("block", lime ? "text-lime-ink" : "text-ink")}>{label}</span>
        {sublabel && (
          <span className="mt-1 block text-muted-2">{sublabel}</span>
        )}
      </figcaption>
    </figure>
  );
}
