import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipProps = {
  children: ReactNode;
  active?: boolean;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Chip({
  children,
  active = false,
  className,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      data-active={active || undefined}
      className={cn(
        "inline-flex items-center rounded-pill border px-4 py-2 font-mono text-[13px] font-medium uppercase tracking-[0.08em] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
        "border-hairline bg-transparent text-ink-soft",
        "hover:border-pine hover:text-pine",
        "data-[active]:border-pine data-[active]:bg-pine-tint data-[active]:text-pine",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
