import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { FormCard } from "@/components/admin/resource-form-layout";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { Button } from "@/components/ui/button";
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
    <PageContainer>
      <PageHeader
        title="Edit post"
        subtitle={post.title}
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/blog">Cancel</Link>
          </Button>
        }
      />
      <FormCard>
        <BlogPostForm post={post} />
      </FormCard>
    </PageContainer>
  );
}
