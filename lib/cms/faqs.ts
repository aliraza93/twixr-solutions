import { cache } from "react";
import { faqs as fileFaqs } from "@/content/faq";
import type { FaqItem } from "@/lib/cms/types";
import { prisma, requireDb, withDb } from "@/lib/cms/db";
import { isPersistedId } from "@/lib/cms/utils";
import { stripEmDashes, stripEmDashesDeep } from "@/lib/content/strip-em-dashes";

export const getFaqs = cache(async (): Promise<FaqItem[]> => {
  return withDb(async () => {
    const rows = await prisma.faq.findMany({ orderBy: { sortOrder: "asc" } });
    if (!rows.length) return stripEmDashesDeep(fileFaqs);
    return rows.map((row) => ({
      question: stripEmDashes(row.question),
      answer: stripEmDashes(row.answer),
      icon: row.icon,
    }));
  }, stripEmDashesDeep(fileFaqs));
});

export async function listFaqsAdmin() {
  return withDb(async () => {
    const rows = await prisma.faq.findMany({ orderBy: { sortOrder: "asc" } });
    if (!rows.length) {
      return fileFaqs.map((item, index) => ({ ...item, id: String(index), sort_order: index }));
    }
    return rows.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      icon: row.icon,
      sort_order: row.sortOrder,
    }));
  }, fileFaqs.map((item, index) => ({ ...item, id: String(index), sort_order: index })));
}

export async function upsertFaq(
  input: FaqItem & { id?: string; sort_order?: number }
) {
  const db = requireDb();
  const data = {
    question: stripEmDashes(input.question),
    answer: stripEmDashes(input.answer),
    icon: input.icon,
    sortOrder: input.sort_order ?? 0,
  };

  if (isPersistedId(input.id)) {
    await db.faq.update({ where: { id: input.id }, data });
    return input.id;
  }

  const created = await db.faq.create({ data });
  return created.id;
}

export async function deleteFaq(id: string) {
  const db = requireDb();
  await db.faq.delete({ where: { id } });
}
