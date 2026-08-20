"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export function ConfirmButton({
  label,
  pendingLabel = "Working…",
  confirmMessage,
  action,
  id,
  className,
}: {
  label: string;
  pendingLabel?: string;
  confirmMessage: string;
  action: (id: string) => Promise<void>;
  id: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={className ?? "cursor-pointer text-sm font-medium text-danger hover:underline"}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        start(async () => {
          try {
            await action(id);
            toast.success("Deleted");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Delete failed");
          }
        });
      }}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
