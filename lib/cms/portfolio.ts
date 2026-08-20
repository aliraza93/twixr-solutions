import { cache } from "react";
import type { Prisma } from "@prisma/client";
import {
  getPortfolioBySlug as fileBySlug,
  getPortfolioProjects as fileProjects,
  getPortfolioSlugs as fileSlugs,
  portfolioCaseStudies,
} from "@/lib/data/portfolio";
import type { PortfolioCaseStudy, PortfolioProject } from "@/lib/cms/types";
import { prisma, requireDb, withDb } from "@/lib/cms/db";
import { isPersistedId } from "@/lib/cms/utils";

function listingOf(study: PortfolioCaseStudy): PortfolioProject {
  const {
    longDescription: _l,
    gallery: _g,
    challenge: _c,
    solution: _s,
    outcomes: _o,
    deliverables: _d,
    timeline: _t,
    role: _r,
    techStack: _tech,
    ...project
  } = study;
  void _l;
  void _g;
  void _c;
  void _s;
  void _o;
  void _d;
  void _t;
  void _r;
  void _tech;
  return project;
}

async function loadAll(): Promise<(PortfolioCaseStudy & { id: string; sort_order: number })[] | null> {
  return withDb(async () => {
    const rows = await prisma.portfolioProject.findMany({
      orderBy: { sortOrder: "asc" },
    });
    if (!rows.length) return null;
    return rows.map((row) => ({
      ...(row.data as unknown as PortfolioCaseStudy),
      slug: row.slug,
      title: row.title,
      featured: row.featured,
      id: row.id,
      sort_order: row.sortOrder,
    }));
  }, null);
}

export const getPortfolioProjects = cache(async (): Promise<PortfolioProject[]> => {
  const rows = await loadAll();
  if (!rows) return fileProjects();
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
    if (!rows) return fileBySlug(slug);
    return rows.find((row) => row.slug === slug);
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
      ...study,
    }));
  }
  return rows;
}

export async function upsertPortfolioProject(
  input: PortfolioCaseStudy & { id?: string; sort_order?: number }
) {
  const db = requireDb();
  const payload = {
    slug: input.slug,
    title: input.title,
    featured: Boolean(input.featured),
    data: input as unknown as Prisma.InputJsonValue,
    sortOrder: input.sort_order ?? 0,
  };

  if (isPersistedId(input.id)) {
    await db.portfolioProject.update({ where: { id: input.id }, data: payload });
    return input.id;
  }

  const created = await db.portfolioProject.upsert({
    where: { slug: input.slug },
    create: payload,
    update: payload,
  });
  return created.id;
}

export async function deletePortfolioProject(id: string) {
  const db = requireDb();
  await db.portfolioProject.delete({ where: { id } });
}
