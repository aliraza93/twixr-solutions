"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteFaqAction, saveFaqAction } from "@/app/admin/actions";
import { TextField, AreaField } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/admin/confirm-dialog";

type Row = {
  id: string;
  question: string;
  answer: string;
  icon: string;
  sort_order: number;
};

export function FaqsAdmin({ faqs }: { faqs: Row[] }) {
  return (
    <div className="space-y-8">
      {faqs.map((item) => (
        <FaqEditor key={item.id} item={item} />
      ))}
      <FaqEditor />
    </div>
  );
}

function FaqEditor({ item }: { item?: Row }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-4 rounded-lg border border-hairline bg-canvas p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(async () => {
          try {
            await saveFaqAction({
              id: item?.id,
              question: String(data.get("question") ?? ""),
              answer: String(data.get("answer") ?? ""),
              icon: String(data.get("icon") ?? "lucide:help-circle"),
              sort_order: Number(data.get("sort_order") ?? 0),
            });
            toast.success("FAQ saved");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Save failed");
          }
        });
      }}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-pine">
        {item ? "Edit FAQ" : "Add FAQ"}
      </p>
      <TextField label="Question" name="question" defaultValue={item?.question} required />
      <AreaField label="Answer" name="answer" defaultValue={item?.answer} required />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Icon" name="icon" defaultValue={item?.icon ?? "lucide:help-circle"} />
        <TextField label="Order" name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} />
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {item ? (
          <ConfirmButton
            label="Delete"
            confirmMessage="Delete this FAQ?"
            action={async (id) => {
              await deleteFaqAction(id);
              router.refresh();
            }}
            id={item.id}
          />
        ) : null}
      </div>
    </form>
  );
}
