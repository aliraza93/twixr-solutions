import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Full-width inner wrapper used on every Studio page. No max-width, no
 * mx-auto - cap individual forms, not the page. See IMEI dashboard-design.md §2.
 */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col gap-6 px-[var(--page-x,1rem)] py-6 md:py-8",
        className
      )}
    >
      {children}
    </div>
  );
}
