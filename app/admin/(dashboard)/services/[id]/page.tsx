import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { FormCard } from "@/components/admin/resource-form-layout";
import { ServiceForm } from "@/components/admin/service-form";
import { Button } from "@/components/ui/button";
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
    <PageContainer>
      <PageHeader
        title="Edit service"
        subtitle={service.title}
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/services">Cancel</Link>
          </Button>
        }
      />
      <FormCard>
        <ServiceForm service={service} />
      </FormCard>
    </PageContainer>
  );
}
