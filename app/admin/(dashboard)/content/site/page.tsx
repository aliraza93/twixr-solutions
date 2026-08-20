import { PageHeader } from "@/components/admin/page-header";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { getHero, getSite } from "@/lib/cms/site";

export default async function SiteContentPage() {
  const [site, hero] = await Promise.all([getSite(), getHero()]);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Content"
        title="Site settings"
        description="Used in nav, metadata, contact, and proof chips."
      />
      <SiteSettingsForm site={site} hero={hero} />
    </div>
  );
}
