import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { site as fallbackSite } from "@/content/site";
import { hero as fallbackHero } from "@/content/hero";
import { prisma, requireDb, withDb } from "@/lib/cms/db";
import type { HeroContent, SiteContent } from "@/lib/cms/types";
import { stripEmDashesDeep } from "@/lib/content/strip-em-dashes";

function asSite(value: unknown): SiteContent {
  const data = (value ?? {}) as Partial<SiteContent>;
  const base = fallbackSite as unknown as SiteContent;
  return stripEmDashesDeep({
    ...base,
    ...data,
    contact: { ...base.contact, ...(data.contact ?? {}) },
    proof: data.proof?.length ? data.proof : base.proof,
    contactMethods: data.contactMethods?.length
      ? data.contactMethods
      : base.contactMethods,
    nav: data.nav?.length ? data.nav : base.nav,
    primaryCta: data.primaryCta ?? base.primaryCta,
  });
}

function asHero(value: unknown): HeroContent {
  const data = (value ?? {}) as Partial<HeroContent>;
  const base = fallbackHero as unknown as HeroContent;
  return stripEmDashesDeep({
    ...base,
    ...data,
    rotatingWords: data.rotatingWords?.length
      ? data.rotatingWords
      : [...base.rotatingWords],
    headingLines: data.headingLines?.length ? data.headingLines : base.headingLines,
    techLogos: data.techLogos?.length ? data.techLogos : base.techLogos,
    moreLogos: data.moreLogos?.length ? data.moreLogos : base.moreLogos,
    dashboard: { ...base.dashboard, ...(data.dashboard ?? {}) },
    primaryCta: data.primaryCta ?? base.primaryCta,
    secondaryCta: data.secondaryCta ?? base.secondaryCta,
  });
}

export const getSite = cache(async (): Promise<SiteContent> => {
  return withDb(async () => {
    const row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    return asSite(row?.site ?? fallbackSite);
  }, asSite(fallbackSite));
});

export const getHero = cache(async (): Promise<HeroContent> => {
  return withDb(async () => {
    const row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    return asHero(row?.hero ?? fallbackHero);
  }, asHero(fallbackHero));
});

export async function saveSiteSettings(input: {
  site: SiteContent;
  hero: HeroContent;
}) {
  const db = requireDb();
  const site = stripEmDashesDeep(input.site);
  const hero = stripEmDashesDeep(input.hero);
  await db.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      site: site as unknown as Prisma.InputJsonValue,
      hero: hero as unknown as Prisma.InputJsonValue,
    },
    update: {
      site: site as unknown as Prisma.InputJsonValue,
      hero: hero as unknown as Prisma.InputJsonValue,
    },
  });
}
