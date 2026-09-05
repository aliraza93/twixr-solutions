"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { unsubscribeSubscriberAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function UnsubscribeButton({
  id,
  email,
  disabled,
}: {
  id: string;
  email: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || pending}
      className="cursor-pointer"
      onClick={() => {
        if (!window.confirm(`Unsubscribe ${email}?`)) return;
        start(async () => {
          try {
            await unsubscribeSubscriberAction(id);
            toast.success("Unsubscribed");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not unsubscribe");
          }
        });
      }}
    >
      {pending ? "Working..." : "Unsubscribe"}
    </Button>
  );
}
