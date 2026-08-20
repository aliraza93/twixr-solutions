import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataToolbar({
  segments,
  children,
  className,
}: {
  segments?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-2.5",
        className
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">{segments}</div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}

export function ToolbarSegment({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center rounded-md px-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {children}
    </Link>
  );
}
