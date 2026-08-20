import { PageHeader } from "@/components/admin/page-header";
import { ServiceForm } from "@/components/admin/service-form";

export default function NewServicePage() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Catalog" title="New service" />
      <ServiceForm />
    </div>
  );
}
