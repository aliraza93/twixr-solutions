"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { Testimonial } from "@/content/testimonials";
import { deleteTestimonialAction, saveTestimonialAction } from "@/app/admin/actions";
import { TextField } from "@/components/admin/fields";
import { RichEditor } from "@/components/admin/markdown-editor";
import { FileUploader } from "@/components/admin/file-uploader";
import { SelectField } from "@/components/admin/select-field";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/admin/confirm-dialog";

type Row = Testimonial & { id: string; sort_order: number };

const PLATFORMS = [
  { value: "simple-icons:upwork", label: "Upwork" },
  { value: "simple-icons:fiverr", label: "Fiverr" },
  { value: "simple-icons:linkedin", label: "LinkedIn" },
  { value: "simple-icons:google", label: "Google" },
  { value: "lucide:quote", label: "Other" },
];

const RATINGS = [5, 4, 3, 2, 1].map((value) => ({
  value: String(value),
  label: `${value} star${value === 1 ? "" : "s"}`,
}));

export function TestimonialsAdmin({ testimonials }: { testimonials: Row[] }) {
  return (
    <div className="space-y-8">
      {testimonials.map((item) => (
        <TestimonialEditor key={item.id} item={item} />
      ))}
      <TestimonialEditor />
    </div>
  );
}

function TestimonialEditor({ item }: { item?: Row }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const platforms = item?.platform && !PLATFORMS.some((p) => p.value === item.platform)
    ? [{ value: item.platform, label: item.platform }, ...PLATFORMS]
    : PLATFORMS;

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const quote = String(data.get("quote") ?? "");
        start(async () => {
          try {
            await saveTestimonialAction({
              id: item?.id,
              quote,
              name: String(data.get("name") ?? ""),
              title: String(data.get("title") ?? ""),
              company: String(data.get("company") ?? ""),
              platform: String(data.get("platform") ?? "simple-icons:upwork"),
              avatar: String(data.get("avatar") ?? ""),
              rating: Number(data.get("rating") ?? 5),
              content: quote,
              role: String(data.get("title") ?? ""),
              image: String(data.get("avatar") ?? ""),
              sort_order: Number(data.get("sort_order") ?? 0),
            });
            toast.success("Testimonial saved");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Save failed");
          }
        });
      }}
    >
      <p className="text-sm font-semibold text-foreground">
        {item ? "Edit quote" : "Add quote"}
      </p>
      <RichEditor
        id={`quote-${item?.id ?? "new"}`}
        name="quote"
        label="Quote"
        defaultValue={item?.quote}
        minHeight="min-h-[120px]"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Name" name="name" defaultValue={item?.name} required />
        <TextField label="Title / context" name="title" defaultValue={item?.title} />
        <TextField label="Company / platform label" name="company" defaultValue={item?.company} />
        <SelectField
          label="Platform"
          name="platform"
          defaultValue={item?.platform ?? "simple-icons:upwork"}
          options={platforms}
        />
        <SelectField
          label="Rating"
          name="rating"
          defaultValue={String(item?.rating ?? 5)}
          options={RATINGS}
        />
        <TextField label="Order" name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} />
      </div>
      <FileUploader label="Avatar" name="avatar" defaultValue={item?.avatar} />
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {item ? (
          <ConfirmButton
            label="Delete"
            confirmMessage="Delete this testimonial?"
            action={async (id) => {
              await deleteTestimonialAction(id);
              router.refresh();
            }}
            id={item.id}
          />
        ) : null}
      </div>
    </form>
  );
}
