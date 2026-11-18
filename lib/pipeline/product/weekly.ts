import type { Brief } from "@prisma/client";
import { requireDb, withDb } from "@/lib/cms/db";
import {
  INVOICORA_PILLAR,
  PRODUCT_PILLAR_PREFIX,
  productInstructions,
} from "@/lib/pipeline/product/invoicora";
import { isProductPostDue, nextUnusedTopic } from "@/lib/pipeline/product/week";

export function productWeeklyEnabled(): boolean {
  return (process.env.PIPELINE_PRODUCT_WEEKLY ?? "true").toLowerCase() !== "false";
}

/**
 * The week's Invoicora brief when one is due, else null so the normal
 * weighted pick runs. Uses a queued product brief first, then creates the
 * next one from the bank.
 */
export async function takeProductBriefIfDue(now = new Date()): Promise<Brief | null> {
  if (!productWeeklyEnabled()) return null;
  return withDb(async () => {
    const db = requireDb();
    const product = { startsWith: PRODUCT_PILLAR_PREFIX };

    const last = await db.brief.findFirst({
      where: { pillar: product, status: "used", usedAt: { not: null } },
      orderBy: { usedAt: "desc" },
      select: { usedAt: true },
    });
    if (!isProductPostDue(last?.usedAt ?? null, now)) return null;

    const queued = await db.brief.findFirst({
      where: {
        pillar: product,
        status: "queued",
        OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
      },
      orderBy: { createdAt: "asc" },
    });
    if (queued) return queued;

    const existing = await db.brief.findMany({
      where: { pillar: product },
      select: { topic: true },
    });
    const next = nextUnusedTopic(existing.map((b) => b.topic));
    if (!next) {
      console.warn("Invoicora topic bank is used up; add topics in lib/pipeline/product/invoicora.ts");
      return null;
    }
    return db.brief.create({
      data: {
        pillar: INVOICORA_PILLAR,
        topic: next.topic,
        targetKeyword: next.targetKeyword,
        angle: next.angle,
        requiresLiveSource: false,
        status: "queued",
        origin: "product",
        extraInstructions: productInstructions(next),
      },
    });
  }, null);
}
