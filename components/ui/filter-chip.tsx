import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type FilterChipProps = {
  children: ReactNode;
  active?: boolean;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function FilterChip({
  children,
  active = false,
  className,
  ...props
}: FilterChipProps) {
  return (
    <Chip
      active={active}
      className={cn(
        "gap-1.5",
        active
          ? "border-ink bg-ink text-canvas hover:border-ink hover:text-canvas data-[active]:border-ink data-[active]:bg-ink data-[active]:text-canvas"
          : "hover:bg-surface hover:text-ink",
        className
      )}
      {...props}
    >
      {children}
    </Chip>
  );
}
