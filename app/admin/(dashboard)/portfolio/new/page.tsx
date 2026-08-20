import { PageHeader } from "@/components/admin/page-header";
import { PortfolioForm } from "@/components/admin/portfolio-form";

export default function NewPortfolioPage() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Catalog" title="New project" />
      <PortfolioForm />
    </div>
  );
}
