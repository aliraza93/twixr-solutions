import { cache } from "react";
import type { Prisma } from "@prisma/client";
import {
  getServiceBySlug as fileBySlug,
  getServiceListings as fileListings,
  getServiceSlugs as fileSlugs,
  services as fileServices,
} from "@/lib/data/services";
import type { ServiceDetail, ServiceListingItem } from "@/lib/cms/types";
import { prisma, requireDb, withDb } from "@/lib/cms/db";
import { isPersistedId } from "@/lib/cms/utils";
import { stripEmDashesDeep } from "@/lib/content/strip-em-dashes";

type ServiceRecord = ServiceDetail & { id: string; sort_order: number };

async function loadAll(): Promise<ServiceRecord[] | null> {
  return withDb(async () => {
    const rows = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
    if (!rows.length) return null;
    return rows.map((row) =>
      stripEmDashesDeep({
        ...(row.data as unknown as ServiceDetail),
        slug: row.slug,
        title: row.title,
        id: row.id,
        sort_order: row.sortOrder,
      })
    );
  }, null);
}

export const getServiceListings = cache(async (): Promise<ServiceListingItem[]> => {
  const rows = await loadAll();
  if (!rows) return stripEmDashesDeep(fileListings());
  return rows;
});

export const getServiceSlugs = cache(async (): Promise<string[]> => {
  const rows = await loadAll();
  if (!rows) return fileSlugs();
  return rows.map((row) => row.slug);
});

export const getServiceBySlug = cache(async (slug: string): Promise<ServiceDetail | undefined> => {
  const rows = await loadAll();
  if (!rows) {
    const file = fileBySlug(slug);
    return file ? stripEmDashesDeep(file) : undefined;
  }
  return rows.find((row) => row.slug === slug);
});

export async function listServicesAdmin() {
  const rows = await loadAll();
  if (!rows) {
    return fileServices.map((service, index) => ({
      ...service,
      id: service.slug,
      sort_order: index,
    }));
  }
  return rows;
}

export async function upsertService(
  input: ServiceDetail & { id?: string; sort_order?: number }
) {
  const db = requireDb();
  const cleaned = stripEmDashesDeep(input);
  const payload = {
    slug: cleaned.slug,
    title: cleaned.title,
    data: cleaned as unknown as Prisma.InputJsonValue,
    sortOrder: cleaned.sort_order ?? 0,
  };

  if (isPersistedId(cleaned.id)) {
    await db.service.update({ where: { id: cleaned.id }, data: payload });
    return cleaned.id;
  }

  const created = await db.service.upsert({
    where: { slug: cleaned.slug },
    create: payload,
    update: payload,
  });
  return created.id;
}

export async function deleteService(id: string) {
  const db = requireDb();
  await db.service.delete({ where: { id } });
}
