import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Button } from "@/components/ui/button";

export type EmptyStateAction =
  | { label: string; href: string; onClick?: never; variant?: "default" | "outline" }
  | { label: string; onClick: () => void; href?: never; variant?: "default" | "outline" };

type Props = {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: EmptyStateAction | { href: string; label: string };
  secondaryAction?: EmptyStateAction;
  children?: ReactNode;
  className?: string;
};

function ActionButton({ action }: { action: EmptyStateAction }) {
  const variant = action.variant ?? "default";

  if ("href" in action && action.href) {
    return (
      <Button asChild size="sm" variant={variant} className="cursor-pointer">
        <Link href={action.href}>{action.label}</Link>
      </Button>
    );
  }

  return (
    <Button size="sm" variant={variant} className="cursor-pointer" onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
}: Props) {
  const primary =
    action && "href" in action && action.href
      ? { label: action.label, href: action.href, variant: "default" as const }
      : (action as EmptyStateAction | undefined);

  return (
    <div
      className={
        className ??
        "flex flex-col items-center justify-center gap-3 py-12 text-center"
      }
    >
      {Icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Icon className="size-6" />
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {primary || secondaryAction ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {primary ? <ActionButton action={primary} /> : null}
          {secondaryAction ? (
            <ActionButton
              action={{
                ...secondaryAction,
                variant: secondaryAction.variant ?? "outline",
              }}
            />
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
