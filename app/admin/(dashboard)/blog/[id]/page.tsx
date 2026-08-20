import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { getBlogPostAdmin } from "@/lib/cms/blog";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getBlogPostAdmin(decodeURIComponent(id));
  if (!post) notFound();

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Publishing" title="Edit post" />
      <BlogPostForm post={post} />
    </div>
  );
}
