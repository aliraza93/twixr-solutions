"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { HeroContent, SiteContent } from "@/lib/cms/types";
import { saveSiteContentAction } from "@/app/admin/actions";
import { TextField } from "@/components/admin/fields";
import { RichEditor } from "@/components/admin/markdown-editor";
import { FormActions } from "@/components/admin/resource-form-layout";
import { Button } from "@/components/ui/button";

export function SiteSettingsForm({
  site,
  hero,
}: {
  site: SiteContent;
  hero: HeroContent;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const nextSite: SiteContent = {
          ...site,
          name: String(data.get("name") ?? site.name),
          brand: String(data.get("brand") ?? site.brand),
          role: String(data.get("role") ?? site.role),
          tagline: String(data.get("tagline") ?? site.tagline),
          yearsExperience: String(data.get("yearsExperience") ?? site.yearsExperience),
          responseTime: String(data.get("responseTime") ?? site.responseTime),
          contact: {
            ...site.contact,
            email: String(data.get("email") ?? site.contact.email),
            upwork: String(data.get("upwork") ?? site.contact.upwork),
            github: String(data.get("github") ?? site.contact.github),
            linkedin: String(data.get("linkedin") ?? site.contact.linkedin),
            booking: String(data.get("booking") ?? site.contact.booking),
            fiverr: String(data.get("fiverr") ?? site.contact.fiverr),
          },
          primaryCta: {
            label: String(data.get("ctaLabel") ?? site.primaryCta.label),
            href: String(data.get("ctaHref") ?? site.primaryCta.href),
          },
        };
        start(async () => {
          try {
            await saveSiteContentAction({ site: nextSite, hero });
            toast.success("Site settings saved");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Save failed");
          }
        });
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TextField label="Name" name="name" defaultValue={site.name} required />
        <TextField label="Brand" name="brand" defaultValue={site.brand} required />
        <TextField label="Role" name="role" defaultValue={site.role} />
        <TextField label="Years of experience" name="yearsExperience" defaultValue={site.yearsExperience} />
        <TextField label="Email" name="email" defaultValue={site.contact.email} />
        <TextField label="Response time" name="responseTime" defaultValue={site.responseTime} />
        <TextField label="Upwork URL" name="upwork" defaultValue={site.contact.upwork} />
        <TextField label="GitHub URL" name="github" defaultValue={site.contact.github} />
        <TextField label="LinkedIn URL" name="linkedin" defaultValue={site.contact.linkedin} />
        <TextField label="Booking URL" name="booking" defaultValue={site.contact.booking} />
        <TextField label="Fiverr URL" name="fiverr" defaultValue={site.contact.fiverr} />
        <TextField label="Primary CTA label" name="ctaLabel" defaultValue={site.primaryCta.label} />
        <TextField label="Primary CTA href" name="ctaHref" defaultValue={site.primaryCta.href} />
      </div>
      <RichEditor
        id="tagline"
        name="tagline"
        label="Tagline"
        defaultValue={site.tagline}
        minHeight="min-h-[120px]"
      />
      <FormActions>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </FormActions>
    </form>
  );
}
