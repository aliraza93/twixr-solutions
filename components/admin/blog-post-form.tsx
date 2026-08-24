"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { BlogPostRecord } from "@/lib/cms/types";
import { saveBlogPostAction } from "@/app/admin/actions";
import { TextField } from "@/components/admin/fields";
import { RichEditor, MarkdownPreview } from "@/components/admin/markdown-editor";
import { FaqBuilder } from "@/components/admin/faq-builder";
import { FileUploader } from "@/components/admin/file-uploader";
import { DatePickerField } from "@/components/admin/date-picker-field";
import { SelectField, SwitchField } from "@/components/admin/select-field";
import { FormActions } from "@/components/admin/resource-form-layout";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/cms/utils";
import { normalizeFaqs } from "@/lib/blog/markdown";

const CATEGORIES = ["SaaS", "Design", "Architecture", "Engineering", "Dubai", "Product"];

export function BlogPostForm({ post }: { post?: BlogPostRecord }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const categories = Array.from(
    new Set([post?.category, ...CATEGORIES].filter(Boolean) as string[])
  ).map((value) => ({ value, label: value }));

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const title = String(data.get("title") ?? "");
        const slug = String(data.get("slug") ?? "") || slugify(title);
        start(async () => {
          try {
            const id = await saveBlogPostAction({
              id: post?.id,
              slug,
              title,
              excerpt: String(data.get("excerpt") ?? ""),
              date: String(data.get("date") ?? ""),
              image: String(data.get("image") ?? ""),
              category: String(data.get("category") ?? ""),
              tags: String(data.get("tags") ?? "")
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
              readingTime: String(data.get("readingTime") ?? ""),
              author: String(data.get("author") ?? "Twixr Solutions"),
              authorRole: String(data.get("authorRole") ?? ""),
              authorImage: String(data.get("authorImage") ?? ""),
              body: String(data.get("body") ?? ""),
              faqs: normalizeFaqs(JSON.parse(String(data.get("faqs") || "[]"))),
              published: data.get("published") === "on",
              order: Number(data.get("order") ?? 0),
            });
            toast.success("Post saved");
            router.push(`/admin/blog/${id}`);
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Save failed");
          }
        });
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TextField label="Title" name="title" defaultValue={post?.title} required />
        <TextField label="Slug" name="slug" defaultValue={post?.slug} hint="Leave blank to generate from title" />
        <SelectField
          label="Category"
          name="category"
          defaultValue={post?.category}
          options={categories}
        />
        <DatePickerField label="Publish date" name="date" defaultValue={post?.date} />
        <TextField label="Reading time" name="readingTime" defaultValue={post?.readingTime} />
        <TextField label="Order" name="order" type="number" defaultValue={post?.order ?? 0} />
        <TextField label="Author" name="author" defaultValue={post?.author} />
        <TextField label="Author role" name="authorRole" defaultValue={post?.authorRole} />
      </div>
      <FileUploader label="Cover image" name="image" defaultValue={post?.image} />
      <FileUploader label="Author image" name="authorImage" defaultValue={post?.authorImage} />
      <TextField
        label="Tags"
        name="tags"
        defaultValue={post?.tags?.join(", ")}
        hint="Comma-separated"
      />
      <RichEditor
        id="excerpt"
        name="excerpt"
        label="Excerpt"
        defaultValue={post?.excerpt}
        minHeight="min-h-[120px]"
        placeholder="Short summary for listings"
      />
      <RichEditor id="body" name="body" label="Body" defaultValue={post?.body} />
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
          Live markdown preview
        </p>
        <MarkdownPreview body={post?.body ?? ""} liveFrom="body" />
      </div>
      <FaqBuilder name="faqs" defaultValue={post?.faqs ?? []} />
      <SwitchField
        name="published"
        label="Published"
        description="Live on the public blog when on."
        defaultChecked={post?.published}
      />
      <FormActions>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save post"}
        </Button>
      </FormActions>
    </form>
  );
}
