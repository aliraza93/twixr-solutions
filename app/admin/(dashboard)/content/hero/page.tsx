import Link from "next/link";
import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { FormCard } from "@/components/admin/resource-form-layout";
import { HeroSettingsForm } from "@/components/admin/hero-settings-form";
import { Button } from "@/components/ui/button";
import { getHero, getSite } from "@/lib/cms/site";

export default async function HeroContentPage() {
  const [site, hero] = await Promise.all([getSite(), getHero()]);
  return (
    <PageContainer>
      <PageHeader
        title="Hero"
        subtitle="Headline, rotating words, subheading, and CTAs."
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/content">Back</Link>
          </Button>
        }
      />
      <FormCard>
        <HeroSettingsForm site={site} hero={hero} />
      </FormCard>
    </PageContainer>
  );
}
