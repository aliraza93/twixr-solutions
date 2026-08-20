import type { ReactNode } from "react";
import { DataTableCard } from "@/components/admin/data-table-card";
import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";

export function ListPage({
  title,
  subtitle,
  actions,
  summary,
  nav,
  toolbar,
  activeFilters,
  table,
  footer,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  summary?: ReactNode;
  nav?: ReactNode;
  toolbar?: ReactNode;
  activeFilters?: ReactNode;
  table: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <PageContainer className={cn(className)}>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {nav}
      {summary}
      <DataTableCard toolbar={toolbar} activeFilters={activeFilters} table={table} />
      {footer}
    </PageContainer>
  );
}
