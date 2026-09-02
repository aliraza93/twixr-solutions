import Link from "next/link";
import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { GenerateBlogForm } from "@/components/admin/generate-blog-form";
import { Button } from "@/components/ui/button";

export default function AdminGenerateBlogPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Generate blog"
        subtitle="Enter a topic signal. Uses the same SEO-aware pipeline as the daily cron."
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/blog">Cancel</Link>
          </Button>
        }
      />
      <GenerateBlogForm />
    </PageContainer>
  );
}
