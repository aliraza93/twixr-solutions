import { cn } from "@/lib/utils";

export function StatusPill({
  status,
}: {
  status: string;
}) {
  const tone =
    status === "unread" || status === "draft"
      ? "bg-pine-tint text-pine"
      : status === "replied" || status === "published"
        ? "bg-lime/40 text-lime-ink"
        : status === "read"
          ? "bg-surface-2 text-ink-soft"
          : "bg-surface text-muted";

  return (
    <span
      className={cn(
        "inline-flex rounded-pill px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em]",
        tone
      )}
    >
      {status}
    </span>
  );
}
