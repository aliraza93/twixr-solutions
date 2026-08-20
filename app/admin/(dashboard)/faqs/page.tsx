import { PageHeader } from "@/components/admin/page-header";
import { FaqsAdmin } from "@/components/admin/faqs-admin";
import { listFaqsAdmin } from "@/lib/cms/faqs";

export default async function AdminFaqsPage() {
  const faqs = await listFaqsAdmin();
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Support" title="FAQs" />
      <FaqsAdmin faqs={faqs} />
    </div>
  );
}
