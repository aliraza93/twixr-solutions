import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconNodeAccent = "pine" | "lime";
type IconNodeSize = "sm" | "md" | "lg";

type IconNodeProps = {
  children: ReactNode;
  label: string;
  sublabel?: string;
  accent?: IconNodeAccent;
  size?: IconNodeSize;
  className?: string;
  active?: boolean;
  quiet?: boolean;
  as?: "figure" | "button";
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "color">;

const SIZE: Record<IconNodeSize, string> = {
  sm: "h-16 w-16",
  md: "h-[72px] w-[72px]",
  lg: "h-24 w-24",
};

const ICON: Record<IconNodeSize, string> = {
  sm: "[&>svg]:h-6 [&>svg]:w-6",
  md: "[&>svg]:h-8 [&>svg]:w-8",
  lg: "[&>svg]:h-8 [&>svg]:w-8",
};

export function IconNode({
  children,
  label,
  sublabel,
  accent = "pine",
  size = "md",
  className,
  active = false,
  quiet = false,
  as: Tag = "figure",
  type = "button",
  ...rest
}: IconNodeProps) {
  const emphasized = active || accent === "lime";
  const CaptionTag = Tag === "button" ? "span" : "figcaption";

  return (
    <Tag
      className={cn(
        "flex flex-col items-center text-center",
        Tag === "button" &&
          "cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        className
      )}
      {...(Tag === "button" ? { type, ...rest } : {})}
    >
      <div
        className={cn(
          "icon-node__ring eq-node-face flex items-center justify-center rounded-full border-[1.5px] bg-canvas transition-[border-color,box-shadow,color,opacity] duration-[var(--dur)] ease-[var(--ease-out)]",
          SIZE[size],
          quiet
            ? emphasized
              ? "border-lime text-pine shadow-[0_0_14px_rgba(190,240,58,0.25)]"
              : "border-hairline-strong text-pine shadow-none"
            : emphasized
              ? "border-lime-deep text-lime-deep [box-shadow:0_0_28px_var(--d-glow),var(--shadow-lime)]"
              : "border-pine text-pine [box-shadow:var(--shadow-node)]"
        )}
      >
        <span className={cn("[&>svg]:stroke-[1.5]", ICON[size])}>{children}</span>
      </div>
      <CaptionTag className="mt-3 max-w-[16ch] font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em]">
        <span
          className={cn(
            "block",
            quiet
              ? emphasized
                ? "text-pine"
                : "text-muted"
              : emphasized
                ? "text-lime-ink"
                : "text-ink"
          )}
        >
          {label}
        </span>
        {sublabel && <span className="mt-1 block text-muted-2">{sublabel}</span>}
      </CaptionTag>
    </Tag>
  );
}
