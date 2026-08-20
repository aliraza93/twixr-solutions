import { PageHeader } from "@/components/admin/page-header";
import { TestimonialsAdmin } from "@/components/admin/testimonials-admin";
import { listTestimonialsAdmin } from "@/lib/cms/testimonials";

export default async function AdminTestimonialsPage() {
  const testimonials = await listTestimonialsAdmin();
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Social proof"
        title="Testimonials"
        description="Real client quotes. Keep wording verbatim."
      />
      <TestimonialsAdmin testimonials={testimonials} />
    </div>
  );
}
