import { PageHeader } from "@/components/admin/page-header";
import { HeroSettingsForm } from "@/components/admin/hero-settings-form";
import { getHero, getSite } from "@/lib/cms/site";

export default async function HeroContentPage() {
  const [site, hero] = await Promise.all([getSite(), getHero()]);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Content" title="Hero" />
      <HeroSettingsForm site={site} hero={hero} />
    </div>
  );
}
