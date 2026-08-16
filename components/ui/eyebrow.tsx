import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EyebrowProps = {
  children: ReactNode;
  className?: string;
  as?: "p" | "span" | "div";
};

export function Eyebrow({
  children,
  className,
  as: Tag = "p",
}: EyebrowProps) {
  return (
    <Tag
      className={cn(
        "flex items-center gap-2 font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em]",
        "text-[var(--eyebrow)]",
        className
      )}
    >
      <span
        aria-hidden
        className="inline-block h-px w-6 shrink-0 bg-[var(--eyebrow-rule)]"
      />
      {children}
    </Tag>
  );
}
