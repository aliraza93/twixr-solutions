import Link from "next/link";
import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { FormCard } from "@/components/admin/resource-form-layout";
import { PortfolioForm } from "@/components/admin/portfolio-form";
import { Button } from "@/components/ui/button";

export default function NewPortfolioPage() {
  return (
    <PageContainer>
      <PageHeader
        title="New project"
        subtitle="Case studies appear on /portfolio."
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/portfolio">Cancel</Link>
          </Button>
        }
      />
      <FormCard>
        <PortfolioForm />
      </FormCard>
    </PageContainer>
  );
}
