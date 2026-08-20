import Link from "next/link";
import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { FormCard } from "@/components/admin/resource-form-layout";
import { ServiceForm } from "@/components/admin/service-form";
import { Button } from "@/components/ui/button";

export default function NewServicePage() {
  return (
    <PageContainer>
      <PageHeader
        title="New service"
        subtitle="Appears on /services once saved."
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/services">Cancel</Link>
          </Button>
        }
      />
      <FormCard>
        <ServiceForm />
      </FormCard>
    </PageContainer>
  );
}
