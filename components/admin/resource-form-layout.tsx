import Link from "next/link";
import type { ReactNode } from "react";
import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FormActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 border-t border-border pt-6", className)}>
      {children}
    </div>
  );
}

export function FormCard({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}>
      {title ? (
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      ) : null}
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className={title ? "mt-6 space-y-6" : "space-y-6"}>{children}</div>
    </div>
  );
}

export function ResourceFormLayout({
  title,
  subtitle,
  cancelHref,
  saveLabel = "Save",
  processing = false,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  cancelHref: string;
  saveLabel?: string;
  processing?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const saveButton = (
    <Button type="submit" form="resource-form" className="h-9 cursor-pointer" disabled={processing}>
      {processing ? "Saving…" : saveLabel}
    </Button>
  );

  return (
    <PageContainer className={className}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" className="h-9 cursor-pointer" asChild>
              <Link href={cancelHref}>Cancel</Link>
            </Button>
            {saveButton}
          </div>
        }
      />
      {children}
    </PageContainer>
  );
}
