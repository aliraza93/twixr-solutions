import { PageHeader } from "@/components/admin/page-header";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Publishing" title="New post" />
      <BlogPostForm />
    </div>
  );
}
