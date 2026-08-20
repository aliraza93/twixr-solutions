"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { Testimonial } from "@/content/testimonials";
import { deleteTestimonialAction, saveTestimonialAction } from "@/app/admin/actions";
import { TextField, AreaField } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/admin/confirm-dialog";

type Row = Testimonial & { id: string; sort_order: number };

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

  return (
    <form
      className="space-y-4 rounded-lg border border-hairline bg-canvas p-5"
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
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-pine">
        {item ? "Edit quote" : "Add quote"}
      </p>
      <AreaField label="Quote" name="quote" defaultValue={item?.quote} required />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Name" name="name" defaultValue={item?.name} required />
        <TextField label="Title / context" name="title" defaultValue={item?.title} />
        <TextField label="Company / platform label" name="company" defaultValue={item?.company} />
        <TextField label="Platform icon" name="platform" defaultValue={item?.platform} />
        <TextField label="Avatar URL" name="avatar" defaultValue={item?.avatar} />
        <TextField label="Rating" name="rating" type="number" defaultValue={item?.rating ?? 5} />
        <TextField label="Order" name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} />
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" variant="primary" disabled={pending}>
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
