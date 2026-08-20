import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { FormCard } from "@/components/admin/resource-form-layout";
import { PortfolioForm } from "@/components/admin/portfolio-form";
import { Button } from "@/components/ui/button";
import { listPortfolioAdmin } from "@/lib/cms/portfolio";

export default async function EditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projects = await listPortfolioAdmin();
  const project = projects.find((item) => item.id === id || item.slug === id);
  if (!project) notFound();

  return (
    <PageContainer>
      <PageHeader
        title="Edit project"
        subtitle={project.title}
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/portfolio">Cancel</Link>
          </Button>
        }
      />
      <FormCard>
        <PortfolioForm project={project} />
      </FormCard>
    </PageContainer>
  );
}
