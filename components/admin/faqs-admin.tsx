"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteFaqAction, saveFaqAction } from "@/app/admin/actions";
import { TextField } from "@/components/admin/fields";
import { RichEditor } from "@/components/admin/markdown-editor";
import { SelectField } from "@/components/admin/select-field";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/admin/confirm-dialog";

type Row = {
  id: string;
  question: string;
  answer: string;
  icon: string;
  sort_order: number;
};

const ICONS = [
  { value: "lucide:help-circle", label: "Help" },
  { value: "lucide:clock", label: "Clock" },
  { value: "lucide:shield", label: "Shield" },
  { value: "lucide:wallet", label: "Wallet" },
  { value: "lucide:layers", label: "Layers" },
  { value: "lucide:globe", label: "Globe" },
  { value: "lucide:message-circle", label: "Message" },
];

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
  const icons = item?.icon && !ICONS.some((icon) => icon.value === item.icon)
    ? [{ value: item.icon, label: item.icon }, ...ICONS]
    : ICONS;

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
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
      <p className="text-sm font-semibold text-foreground">
        {item ? "Edit FAQ" : "Add FAQ"}
      </p>
      <TextField label="Question" name="question" defaultValue={item?.question} required />
      <RichEditor
        id={`answer-${item?.id ?? "new"}`}
        name="answer"
        label="Answer"
        defaultValue={item?.answer}
        minHeight="min-h-[140px]"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Icon"
          name="icon"
          defaultValue={item?.icon ?? "lucide:help-circle"}
          options={icons}
        />
        <TextField label="Order" name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} />
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
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
