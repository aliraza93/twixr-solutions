import Link from "next/link";
import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { FormCard } from "@/components/admin/resource-form-layout";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { Button } from "@/components/ui/button";

export default function NewBlogPostPage() {
  return (
    <PageContainer>
      <PageHeader
        title="New post"
        subtitle="Draft stays off the public blog until you publish."
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/blog">Cancel</Link>
          </Button>
        }
      />
      <FormCard>
        <BlogPostForm />
      </FormCard>
    </PageContainer>
  );
}
