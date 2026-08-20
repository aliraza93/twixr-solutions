import { FileText, Sparkles } from "lucide-react";
import { ActionCard } from "@/components/admin/action-card";
import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";

export default function ContentHubPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Site copy"
        subtitle="Edit the live homepage and chrome. Other sections stay in the repo."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          href="/admin/content/site"
          title="Site settings"
          description="Brand, role, contact methods, nav, and proof stats."
          icon={FileText}
          tone="primary"
        />
        <ActionCard
          href="/admin/content/hero"
          title="Hero"
          description="Headline, rotating words, subheading, and CTAs."
          icon={Sparkles}
        />
      </div>
    </PageContainer>
  );
}
