import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { FaqsAdmin } from "@/components/admin/faqs-admin";
import { listFaqsAdmin } from "@/lib/cms/faqs";

export default async function AdminFaqsPage() {
  const faqs = await listFaqsAdmin();
  return (
    <PageContainer>
      <PageHeader title="FAQs" subtitle="Shown on the homepage support section." />
      <FaqsAdmin faqs={faqs} />
    </PageContainer>
  );
}
