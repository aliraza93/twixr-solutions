import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { PortfolioForm } from "@/components/admin/portfolio-form";
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
    <div className="space-y-8">
      <PageHeader eyebrow="Catalog" title="Edit project" />
      <PortfolioForm project={project} />
    </div>
  );
}
