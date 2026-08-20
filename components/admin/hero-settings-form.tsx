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

export function HeroSettingsForm({
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
        const nextHero: HeroContent = {
          ...hero,
          eyebrow: String(data.get("eyebrow") ?? hero.eyebrow),
          stableHeading: String(data.get("stableHeading") ?? hero.stableHeading),
          rotatingWords: String(data.get("rotatingWords") ?? "")
            .split(",")
            .map((word) => word.trim())
            .filter(Boolean),
          subheading: String(data.get("subheading") ?? hero.subheading),
          proofChip: String(data.get("proofChip") ?? hero.proofChip),
          primaryCta: {
            label: String(data.get("primaryLabel") ?? hero.primaryCta.label),
            href: String(data.get("primaryHref") ?? hero.primaryCta.href),
          },
          secondaryCta: {
            label: String(data.get("secondaryLabel") ?? hero.secondaryCta.label),
            href: String(data.get("secondaryHref") ?? hero.secondaryCta.href),
          },
        };
        start(async () => {
          try {
            await saveSiteContentAction({ site, hero: nextHero });
            toast.success("Hero saved");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Save failed");
          }
        });
      }}
    >
      <TextField label="Eyebrow" name="eyebrow" defaultValue={hero.eyebrow} />
      <TextField label="Stable heading" name="stableHeading" defaultValue={hero.stableHeading} />
      <TextField
        label="Rotating words"
        name="rotatingWords"
        defaultValue={hero.rotatingWords.join(", ")}
        hint="Comma-separated"
      />
      <RichEditor
        id="subheading"
        name="subheading"
        label="Subheading"
        defaultValue={hero.subheading}
        minHeight="min-h-[120px]"
      />
      <TextField label="Proof chip" name="proofChip" defaultValue={hero.proofChip} />
      <div className="grid gap-5 md:grid-cols-2">
        <TextField label="Primary CTA label" name="primaryLabel" defaultValue={hero.primaryCta.label} />
        <TextField label="Primary CTA href" name="primaryHref" defaultValue={hero.primaryCta.href} />
        <TextField label="Secondary CTA label" name="secondaryLabel" defaultValue={hero.secondaryCta.label} />
        <TextField label="Secondary CTA href" name="secondaryHref" defaultValue={hero.secondaryCta.href} />
      </div>
      <FormActions>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save hero"}
        </Button>
      </FormActions>
    </form>
  );
}
