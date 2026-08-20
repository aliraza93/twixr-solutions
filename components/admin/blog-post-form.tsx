"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { BlogPostRecord } from "@/lib/cms/types";
import { saveBlogPostAction } from "@/app/admin/actions";
import { TextField, AreaField } from "@/components/admin/fields";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/cms/utils";

export function BlogPostForm({ post }: { post?: BlogPostRecord }) {
  const router = useRouter();
  const [pending, start] = useTransition();

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
        <TextField label="Category" name="category" defaultValue={post?.category} />
        <TextField label="Date" name="date" defaultValue={post?.date} hint="Shown as written, e.g. September 10, 2025" />
        <TextField label="Reading time" name="readingTime" defaultValue={post?.readingTime} />
        <TextField label="Order" name="order" type="number" defaultValue={post?.order ?? 0} />
        <TextField label="Author" name="author" defaultValue={post?.author} />
        <TextField label="Author role" name="authorRole" defaultValue={post?.authorRole} />
      </div>
      <TextField label="Cover image URL" name="image" defaultValue={post?.image} />
      <TextField label="Author image URL" name="authorImage" defaultValue={post?.authorImage} />
      <TextField
        label="Tags"
        name="tags"
        defaultValue={post?.tags?.join(", ")}
        hint="Comma-separated"
      />
      <AreaField label="Excerpt" name="excerpt" defaultValue={post?.excerpt} />
      <MarkdownEditor id="body" name="body" label="Body" defaultValue={post?.body} />
      <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="published"
          defaultChecked={post?.published}
          className="h-4 w-4 accent-pine"
        />
        Published
      </label>
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Saving…" : "Save post"}
      </Button>
    </form>
  );
}
