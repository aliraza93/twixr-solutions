"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { PortfolioCaseStudy } from "@/lib/data/portfolio";
import { savePortfolioAction } from "@/app/admin/actions";
import { AreaField, TextField } from "@/components/admin/fields";
import { RichEditor } from "@/components/admin/markdown-editor";
import { FileUploader } from "@/components/admin/file-uploader";
import { SelectField, SwitchField } from "@/components/admin/select-field";
import { FormActions } from "@/components/admin/resource-form-layout";
import { Button } from "@/components/ui/button";
import { splitComma, splitLines, slugify } from "@/lib/cms/utils";

type Record = PortfolioCaseStudy & { id?: string; sort_order?: number };

const CATEGORIES = [
  { value: "saas", label: "SaaS" },
  { value: "ai", label: "AI" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "devops", label: "DevOps" },
];

const YEARS = Array.from({ length: 12 }, (_, index) => {
  const year = String(new Date().getFullYear() - index);
  return { value: year, label: year };
});

export function PortfolioForm({ project }: { project?: Record }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const years = project?.year && !YEARS.some((item) => item.value === project.year)
    ? [{ value: project.year, label: project.year }, ...YEARS]
    : YEARS;

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const title = String(data.get("title") ?? "");
        const metrics = splitLines(String(data.get("metrics") ?? "")).map((line) => {
          const [label, ...rest] = line.split(":");
          return { label: label.trim(), value: rest.join(":").trim() };
        });
        const payload: Record = {
          id: project?.id,
          slug: String(data.get("slug") ?? "") || slugify(title),
          title,
          description: String(data.get("description") ?? ""),
          longDescription: String(data.get("longDescription") ?? ""),
          categoryId: (String(data.get("categoryId") ?? "saas") as PortfolioCaseStudy["categoryId"]),
          categoryLabel: String(data.get("categoryLabel") ?? ""),
          image: String(data.get("image") ?? ""),
          tags: splitComma(String(data.get("tags") ?? "")),
          year: String(data.get("year") ?? ""),
          client: String(data.get("client") ?? ""),
          link: String(data.get("link") ?? "") || undefined,
          featured: data.get("featured") === "on",
          metrics,
          gallery: splitLines(String(data.get("gallery") ?? "")),
          challenge: String(data.get("challenge") ?? ""),
          solution: String(data.get("solution") ?? ""),
          outcomes: splitLines(String(data.get("outcomes") ?? "")),
          deliverables: splitLines(String(data.get("deliverables") ?? "")),
          timeline: String(data.get("timeline") ?? ""),
          role: String(data.get("role") ?? ""),
          techStack: splitComma(String(data.get("techStack") ?? "")),
          sort_order: Number(data.get("sort_order") ?? 0),
        };
        start(async () => {
          try {
            const id = await savePortfolioAction(payload);
            toast.success("Project saved");
            router.push(`/admin/portfolio/${id}`);
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Save failed");
          }
        });
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TextField label="Title" name="title" defaultValue={project?.title} required />
        <TextField label="Slug" name="slug" defaultValue={project?.slug} />
        <SelectField
          label="Category"
          name="categoryId"
          defaultValue={project?.categoryId ?? "saas"}
          options={CATEGORIES}
        />
        <TextField label="Category label" name="categoryLabel" defaultValue={project?.categoryLabel} />
        <SelectField label="Year" name="year" defaultValue={project?.year} options={years} />
        <TextField label="Client" name="client" defaultValue={project?.client} />
        <TextField label="Role" name="role" defaultValue={project?.role} />
        <TextField label="Timeline" name="timeline" defaultValue={project?.timeline} />
        <TextField label="Order" name="sort_order" type="number" defaultValue={project?.sort_order ?? 0} />
        <TextField label="External link" name="link" defaultValue={project?.link} />
      </div>
      <FileUploader label="Cover image" name="image" defaultValue={project?.image} />
      <TextField label="Tags" name="tags" defaultValue={project?.tags.join(", ")} />
      <TextField label="Tech stack" name="techStack" defaultValue={project?.techStack.join(", ")} />
      <RichEditor
        id="description"
        name="description"
        label="Short description"
        defaultValue={project?.description}
        minHeight="min-h-[120px]"
      />
      <RichEditor
        id="longDescription"
        name="longDescription"
        label="Long description"
        defaultValue={project?.longDescription}
      />
      <RichEditor
        id="challenge"
        name="challenge"
        label="Challenge"
        defaultValue={project?.challenge}
        minHeight="min-h-[140px]"
      />
      <RichEditor
        id="solution"
        name="solution"
        label="Solution"
        defaultValue={project?.solution}
        minHeight="min-h-[140px]"
      />
      <AreaField label="Outcomes" name="outcomes" defaultValue={project?.outcomes.join("\n")} hint="One per line" />
      <AreaField label="Deliverables" name="deliverables" defaultValue={project?.deliverables.join("\n")} />
      <FileUploader label="Gallery" name="gallery" multiple defaultValue={project?.gallery} />
      <AreaField
        label="Metrics"
        name="metrics"
        defaultValue={project?.metrics.map((m) => `${m.label}: ${m.value}`).join("\n")}
        hint="One per line as Label: Value"
      />
      <SwitchField
        name="featured"
        label="Featured on homepage"
        description="Shows in Selected work when on."
        defaultChecked={project?.featured}
      />
      <FormActions>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save project"}
        </Button>
      </FormActions>
    </form>
  );
}
