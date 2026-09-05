import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { caseStudyBodies } from "@/content/case-studies";
import {
  getPortfolioBySlug as fileBySlug,
  getPortfolioProjects as fileProjects,
  getPortfolioSlugs as fileSlugs,
  portfolioCaseStudies,
  resolveCaseStudyBody,
  toPortfolioListing,
} from "@/lib/data/portfolio";
import type { PortfolioCaseStudy, PortfolioProject } from "@/lib/cms/types";
import { prisma, requireDb, withDb } from "@/lib/cms/db";
import { isPersistedId } from "@/lib/cms/utils";
import { stripEmDashesDeep } from "@/lib/content/strip-em-dashes";

function listingOf(study: PortfolioCaseStudy): PortfolioProject {
  return toPortfolioListing(study);
}

function withResolvedBody<T extends PortfolioCaseStudy>(study: T): T {
  return {
    ...study,
    body: resolveCaseStudyBody(study, caseStudyBodies[study.slug] ?? ""),
  };
}

async function loadAll(): Promise<(PortfolioCaseStudy & { id: string; sort_order: number })[] | null> {
  return withDb(async () => {
    const rows = await prisma.portfolioProject.findMany({
      orderBy: { sortOrder: "asc" },
    });
    if (!rows.length) return null;
    return rows.map((row) =>
      stripEmDashesDeep({
        ...(row.data as unknown as PortfolioCaseStudy),
        slug: row.slug,
        title: row.title,
        featured: row.featured,
        id: row.id,
        sort_order: row.sortOrder,
      })
    );
  }, null);
}

export const getPortfolioProjects = cache(async (): Promise<PortfolioProject[]> => {
  const rows = await loadAll();
  if (!rows) return stripEmDashesDeep(fileProjects());
  return rows.map(listingOf);
});

export const getFeaturedProjects = cache(async (): Promise<PortfolioProject[]> => {
  const all = await getPortfolioProjects();
  return all.filter((p) => p.featured);
});

export const getPortfolioSlugs = cache(async (): Promise<string[]> => {
  const rows = await loadAll();
  if (!rows) return fileSlugs();
  return rows.map((row) => row.slug);
});

export const getPortfolioBySlug = cache(
  async (slug: string): Promise<PortfolioCaseStudy | undefined> => {
    const rows = await loadAll();
    if (!rows) {
      const file = fileBySlug(slug);
      return file ? stripEmDashesDeep(withResolvedBody(file)) : undefined;
    }
    const row = rows.find((item) => item.slug === slug);
    return row ? stripEmDashesDeep(withResolvedBody(row)) : undefined;
  }
);

export async function getRelatedProjects(slug: string, limit = 3): Promise<PortfolioProject[]> {
  const current = await getPortfolioBySlug(slug);
  const all = (await getPortfolioProjects()).filter((p) => p.slug !== slug);
  if (!current) return all.slice(0, limit);
  const sameCategory = all.filter((p) => p.categoryId === current.categoryId);
  const pool = sameCategory.length >= limit ? sameCategory : all;
  return pool.slice(0, limit);
}

export async function listPortfolioAdmin() {
  const rows = await loadAll();
  if (!rows) {
    return portfolioCaseStudies.map((study, index) => ({
      id: study.slug,
      sort_order: index,
      ...withResolvedBody(study),
    }));
  }
  return rows.map((row) => withResolvedBody(row));
}

export async function upsertPortfolioProject(
  input: PortfolioCaseStudy & { id?: string; sort_order?: number }
) {
  const db = requireDb();
  const cleaned = stripEmDashesDeep(input);
  const payload = {
    slug: cleaned.slug,
    title: cleaned.title,
    featured: Boolean(cleaned.featured),
    data: cleaned as unknown as Prisma.InputJsonValue,
    sortOrder: cleaned.sort_order ?? 0,
  };

  if (isPersistedId(cleaned.id)) {
    await db.portfolioProject.update({ where: { id: cleaned.id }, data: payload });
    return cleaned.id;
  }

  const created = await db.portfolioProject.upsert({
    where: { slug: cleaned.slug },
    create: payload,
    update: payload,
  });
  return created.id;
}

export async function deletePortfolioProject(id: string) {
  const db = requireDb();
  await db.portfolioProject.delete({ where: { id } });
}
