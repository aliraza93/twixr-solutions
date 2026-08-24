import { cache } from "react";
import { testimonials as fileTestimonials } from "@/content/testimonials";
import type { Testimonial } from "@/lib/cms/types";
import { prisma, requireDb, withDb } from "@/lib/cms/db";
import { isPersistedId } from "@/lib/cms/utils";
import { stripEmDashes, stripEmDashesDeep } from "@/lib/content/strip-em-dashes";

function toItem(row: {
  id: string;
  quote: string;
  name: string;
  title: string;
  company: string;
  platform: string;
  avatar: string;
  rating: number;
  sortOrder: number;
}): Testimonial & { id: string; sort_order: number } {
  const quote = stripEmDashes(row.quote);
  return {
    id: row.id,
    quote,
    name: row.name,
    title: stripEmDashes(row.title),
    company: stripEmDashes(row.company),
    platform: row.platform,
    avatar: row.avatar,
    rating: row.rating,
    content: quote,
    role: stripEmDashes(row.title || row.company || "Client"),
    image: row.avatar,
    sort_order: row.sortOrder,
  };
}

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  return withDb(async () => {
    const rows = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
    return rows.length ? rows.map(toItem) : stripEmDashesDeep(fileTestimonials);
  }, stripEmDashesDeep(fileTestimonials));
});

export async function listTestimonialsAdmin() {
  return withDb(async () => {
    const rows = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
    if (!rows.length) {
      return fileTestimonials.map((item, index) => ({
        ...item,
        id: String(index),
        sort_order: index,
      }));
    }
    return rows.map(toItem);
  }, fileTestimonials.map((item, index) => ({ ...item, id: String(index), sort_order: index })));
}

export async function upsertTestimonial(
  input: Testimonial & { id?: string; sort_order?: number }
) {
  const db = requireDb();
  const data = {
    quote: stripEmDashes(input.quote),
    name: input.name,
    title: stripEmDashes(input.title),
    company: stripEmDashes(input.company),
    platform: input.platform,
    avatar: input.avatar,
    rating: input.rating,
    sortOrder: input.sort_order ?? 0,
  };

  if (isPersistedId(input.id)) {
    await db.testimonial.update({ where: { id: input.id }, data });
    return input.id;
  }

  const created = await db.testimonial.create({ data });
  return created.id;
}

export async function deleteTestimonial(id: string) {
  const db = requireDb();
  await db.testimonial.delete({ where: { id } });
}
