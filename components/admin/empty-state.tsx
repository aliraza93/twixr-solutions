import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-hairline-strong bg-surface px-6 py-16 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-pine-tint text-pine">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h2 className="mt-4 font-sora text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      {action ? (
        <Button asChild variant="primary" className="mt-6">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
