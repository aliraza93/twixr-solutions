import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { TestimonialsAdmin } from "@/components/admin/testimonials-admin";
import { listTestimonialsAdmin } from "@/lib/cms/testimonials";

export default async function AdminTestimonialsPage() {
  const testimonials = await listTestimonialsAdmin();
  return (
    <PageContainer>
      <PageHeader
        title="Testimonials"
        subtitle="Real client quotes. Keep wording verbatim."
      />
      <TestimonialsAdmin testimonials={testimonials} />
    </PageContainer>
  );
}
