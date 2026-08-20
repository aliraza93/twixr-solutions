import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataTableCard({
  toolbar,
  activeFilters,
  table,
  className,
}: {
  toolbar?: ReactNode;
  activeFilters?: ReactNode;
  table: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card",
        className
      )}
    >
      {toolbar}
      {activeFilters ? (
        <div className="border-b border-border px-3 py-2">{activeFilters}</div>
      ) : null}
      <div className="p-3">{table}</div>
    </div>
  );
}
