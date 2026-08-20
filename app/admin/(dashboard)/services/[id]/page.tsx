import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ServiceForm } from "@/components/admin/service-form";
import { listServicesAdmin } from "@/lib/cms/services";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const services = await listServicesAdmin();
  const service = services.find((item) => item.id === id || item.slug === id);
  if (!service) notFound();

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Catalog" title="Edit service" />
      <ServiceForm service={service} />
    </div>
  );
}
