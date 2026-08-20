import Link from "next/link";
import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { FormCard } from "@/components/admin/resource-form-layout";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { Button } from "@/components/ui/button";
import { getHero, getSite } from "@/lib/cms/site";

export default async function SiteContentPage() {
  const [site, hero] = await Promise.all([getSite(), getHero()]);
  return (
    <PageContainer>
      <PageHeader
        title="Site settings"
        subtitle="Used in nav, metadata, contact, and proof chips."
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/content">Back</Link>
          </Button>
        }
      />
      <FormCard>
        <SiteSettingsForm site={site} hero={hero} />
      </FormCard>
    </PageContainer>
  );
}
