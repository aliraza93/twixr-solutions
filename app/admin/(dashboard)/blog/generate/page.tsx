import { GenerateBlogForm } from "@/components/admin/generate-blog-form";

export default function AdminGenerateBlogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Generate Blog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter a topic signal. The same SEO-aware pipeline as the daily cron
          handles planning, links, generation, and follow-up opportunities.
        </p>
      </div>
      <GenerateBlogForm />
    </div>
  );
}
