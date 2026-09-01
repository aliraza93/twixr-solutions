import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Status =
  | "success"
  | "clean"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "active"
  | "enabled"
  | "disabled"
  | "revoked";

const statusConfig: Record<Status, { label: string; className: string }> = {
  success: {
    label: "Success",
    className: "bg-success/15 text-success border-success/30",
  },
  clean: {
    label: "Clean",
    className: "bg-success/15 text-success border-success/30",
  },
  pending: {
    label: "Pending",
    className: "bg-secondary text-muted-foreground border-border",
  },
  processing: {
    label: "Processing",
    className: "bg-accent text-accent-foreground border-primary/20",
  },
  completed: {
    label: "Completed",
    className: "bg-success/15 text-success border-success/30",
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
  active: {
    label: "Active",
    className: "bg-success/15 text-success border-success/30",
  },
  enabled: {
    label: "Enabled",
    className: "bg-success/15 text-success border-success/30",
  },
  disabled: {
    label: "Disabled",
    className: "bg-warning-soft text-warning border-warning/30",
  },
  revoked: {
    label: "Revoked",
    className: "bg-secondary text-muted-foreground border-border",
  },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: Status;
  label?: string;
  className?: string;
}) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn("capitalize", config.className, className)}>
      {label ?? config.label}
    </Badge>
  );
}

const PILL_MAP: Record<string, { status: Status; label: string }> = {
  unread: { status: "processing", label: "Unread" },
  read: { status: "pending", label: "Read" },
  replied: { status: "success", label: "Replied" },
  archived: { status: "revoked", label: "Archived" },
  published: { status: "enabled", label: "Published" },
  draft: { status: "disabled", label: "Draft" },
  ready: { status: "processing", label: "Ready" },
  posted: { status: "enabled", label: "Posted" },
  discarded: { status: "revoked", label: "Discarded" },
};

/** Maps CMS status strings onto the shared StatusBadge. */
export function StatusPill({ status }: { status: string }) {
  const config = PILL_MAP[status] ?? { status: "pending" as Status, label: status };
  return <StatusBadge status={config.status} label={config.label} />;
}
