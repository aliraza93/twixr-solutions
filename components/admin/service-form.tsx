"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { ServiceDetail } from "@/lib/data/services";
import { saveServiceAction } from "@/app/admin/actions";
import { AreaField, TextField } from "@/components/admin/fields";
import { RichEditor } from "@/components/admin/markdown-editor";
import { FileUploader } from "@/components/admin/file-uploader";
import { SelectField } from "@/components/admin/select-field";
import { FormActions } from "@/components/admin/resource-form-layout";
import { Button } from "@/components/ui/button";
import { splitComma, splitLines, slugify } from "@/lib/cms/utils";

type ServiceRecord = ServiceDetail & { id?: string; sort_order?: number };

const CATEGORIES = [
  { value: "product", label: "Product" },
  { value: "backend", label: "Backend" },
  { value: "ai", label: "AI" },
  { value: "cloud", label: "Cloud" },
];

const ICONS = [
  { value: "Layers", label: "Layers" },
  { value: "Server", label: "Server" },
  { value: "Monitor", label: "Monitor" },
  { value: "Bot", label: "Bot" },
  { value: "Cloud", label: "Cloud" },
];

export function ServiceForm({ service }: { service?: ServiceRecord }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const title = String(data.get("title") ?? "");
        const payload: ServiceRecord = {
          id: service?.id,
          slug: String(data.get("slug") ?? "") || slugify(title),
          title,
          description: String(data.get("description") ?? ""),
          longDescription: String(data.get("longDescription") ?? ""),
          icon: (String(data.get("icon") ?? "Layers") as ServiceDetail["icon"]),
          illustration: String(data.get("illustration") ?? ""),
          categoryId: (String(data.get("categoryId") ?? "product") as ServiceDetail["categoryId"]),
          categoryLabel: String(data.get("categoryLabel") ?? ""),
          tags: splitComma(String(data.get("tags") ?? "")),
          gallery: splitLines(String(data.get("gallery") ?? "")),
          included: splitLines(String(data.get("included") ?? "")),
          sidebarHighlights: splitLines(String(data.get("sidebarHighlights") ?? "")),
          packages: safeJson(String(data.get("packages") ?? ""), service?.packages ?? []),
          faqs: safeJson(String(data.get("faqs") ?? ""), service?.faqs ?? []),
          sort_order: Number(data.get("sort_order") ?? 0),
        };
        start(async () => {
          try {
            const id = await saveServiceAction(payload);
            toast.success("Service saved");
            router.push(`/admin/services/${id}`);
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Save failed");
          }
        });
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TextField label="Title" name="title" defaultValue={service?.title} required />
        <TextField label="Slug" name="slug" defaultValue={service?.slug} />
        <SelectField
          label="Category"
          name="categoryId"
          defaultValue={service?.categoryId ?? "product"}
          options={CATEGORIES}
        />
        <TextField label="Category label" name="categoryLabel" defaultValue={service?.categoryLabel} />
        <SelectField
          label="Icon"
          name="icon"
          defaultValue={service?.icon ?? "Layers"}
          options={ICONS}
        />
        <TextField label="Order" name="sort_order" type="number" defaultValue={service?.sort_order ?? 0} />
      </div>
      <FileUploader
        label="Illustration"
        name="illustration"
        defaultValue={service?.illustration}
      />
      <TextField label="Tags" name="tags" defaultValue={service?.tags.join(", ")} />
      <RichEditor
        id="description"
        name="description"
        label="Short description"
        defaultValue={service?.description}
        minHeight="min-h-[120px]"
      />
      <RichEditor
        id="longDescription"
        name="longDescription"
        label="Long description"
        defaultValue={service?.longDescription}
      />
      <FileUploader
        label="Gallery"
        name="gallery"
        multiple
        defaultValue={service?.gallery}
      />
      <AreaField label="Included" name="included" defaultValue={service?.included.join("\n")} hint="One per line" />
      <AreaField label="Sidebar highlights" name="sidebarHighlights" defaultValue={service?.sidebarHighlights.join("\n")} />
      <AreaField
        label="Packages JSON"
        name="packages"
        defaultValue={JSON.stringify(service?.packages ?? [], null, 2)}
        rows={10}
      />
      <AreaField
        label="FAQs JSON"
        name="faqs"
        defaultValue={JSON.stringify(service?.faqs ?? [], null, 2)}
        rows={8}
      />
      <FormActions>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save service"}
        </Button>
      </FormActions>
    </form>
  );
}

function safeJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
