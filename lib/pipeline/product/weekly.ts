import type { Brief } from "@prisma/client";
import { requireDb, withDb } from "@/lib/cms/db";
import { productInstructions } from "@/lib/pipeline/product/catalog";
import { INVOICORA } from "@/lib/pipeline/product/invoicora";
import type { Product } from "@/lib/pipeline/product/types";
import { isProductPostDue, nextUnusedTopic } from "@/lib/pipeline/product/week";

export function productWeeklyEnabled(): boolean {
  return (process.env.PIPELINE_PRODUCT_WEEKLY ?? "true").toLowerCase() !== "false";
}

/**
 * The next brief for `product`: a queued one first (oldest, due now), else a
 * new one from the product's topic bank. Null when the bank is used up.
 */
export async function nextProductBrief(product: Product, now = new Date()): Promise<Brief | null> {
  return withDb(async () => {
    const db = requireDb();
    const queued = await db.brief.findFirst({
      where: {
        pillar: product.pillar,
        status: "queued",
        OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
      },
      orderBy: { createdAt: "asc" },
    });
    if (queued) return queued;

    const existing = await db.brief.findMany({
      where: { pillar: product.pillar },
      select: { topic: true },
    });
    const next = nextUnusedTopic(
      existing.map((b) => b.topic),
      product
    );
    if (!next) {
      console.warn(
        `${product.name} topic bank is used up; add topics in lib/pipeline/product/${product.key}.ts`
      );
      return null;
    }
    return db.brief.create({
      data: {
        pillar: product.pillar,
        topic: next.topic,
        targetKeyword: next.targetKeyword,
        angle: next.angle,
        requiresLiveSource: false,
        status: "queued",
        origin: "product",
        extraInstructions: productInstructions(product, next),
      },
    });
  }, null);
}

/** When `product`'s last brief was used, or null if never. */
export async function lastProductUse(product: Product): Promise<Date | null> {
  return withDb(async () => {
    const db = requireDb();
    const last = await db.brief.findFirst({
      where: { pillar: product.pillar, status: "used", usedAt: { not: null } },
      orderBy: { usedAt: "desc" },
      select: { usedAt: true },
    });
    return last?.usedAt ?? null;
  }, null);
}

/**
 * The week's Invoicora brief when one is due, else null so the normal
 * weighted pick runs. Only Invoicora's own pillar counts: GTA6 Shorts runs
 * on its own lane (lib/pipeline/product/gta6-lane.ts) and must not use up
 * Invoicora's weekly slot.
 */
export async function takeProductBriefIfDue(now = new Date()): Promise<Brief | null> {
  if (!productWeeklyEnabled()) return null;
  if (!isProductPostDue(await lastProductUse(INVOICORA), now)) return null;
  return nextProductBrief(INVOICORA, now);
}
