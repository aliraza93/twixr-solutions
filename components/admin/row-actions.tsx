"use client";

import Link from "next/link";
import { ExternalLink, Loader2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const iconButtonClass =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50";

function ActionIcon({
  label,
  className,
  children,
  ...props
}: {
  label: string;
  className?: string;
  children: ReactNode;
} & React.ComponentProps<"button">) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(iconButtonClass, className)}
          {...props}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export function RowActions({
  editHref,
  viewHref,
  deleteConfig,
}: {
  editHref?: string;
  viewHref?: string;
  deleteConfig?: {
    id: string;
    confirmMessage: string;
    action: (id: string) => Promise<void>;
  };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center justify-end gap-0.5">
      {editHref ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={editHref}
              aria-label="Edit"
              className={iconButtonClass}
            >
              <Pencil className="size-3.5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top">Edit</TooltipContent>
        </Tooltip>
      ) : null}

      {viewHref ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={viewHref}
              target="_blank"
              rel="noreferrer"
              aria-label="View"
              className={iconButtonClass}
            >
              <ExternalLink className="size-3.5" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="top">View</TooltipContent>
        </Tooltip>
      ) : null}

      {deleteConfig ? (
        <ActionIcon
          label={pending ? "Deleting…" : "Delete"}
          disabled={pending}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            if (!window.confirm(deleteConfig.confirmMessage)) return;
            start(async () => {
              try {
                await deleteConfig.action(deleteConfig.id);
                toast.success("Deleted");
                router.refresh();
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Delete failed"
                );
              }
            });
          }}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </ActionIcon>
      ) : null}
    </div>
  );
}
