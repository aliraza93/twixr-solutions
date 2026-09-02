import { requireDb, withDb } from "@/lib/cms/db";
import type { ScoredOpportunity } from "@/lib/pipeline/seo/opportunities";

function normalizeTopicKey(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Persist scored opportunities. Dedupes against queued/promoted rows by topic key.
 */
export async function saveTopicOpportunities(
  rows: ScoredOpportunity[],
  sourceBlogPostId: string
): Promise<{ saved: number; skipped: number }> {
  if (!rows.length) return { saved: 0, skipped: 0 };

  return withDb(async () => {
    const db = requireDb();
    const existing = await db.topicOpportunity.findMany({
      where: { status: { in: ["queued", "promoted"] } },
      select: { topic: true },
    });
    const existingKeys = new Set(existing.map((r) => normalizeTopicKey(r.topic)));

    let saved = 0;
    let skipped = 0;

    for (const row of rows) {
      const key = normalizeTopicKey(row.topic);
      if (existingKeys.has(key)) {
        skipped += 1;
        continue;
      }
      existingKeys.add(key);
      await db.topicOpportunity.create({
        data: {
          topic: row.topic,
          cluster: row.cluster,
          type: row.type,
          pillar: row.pillar,
          parentTopic: row.parentTopic,
          parentSlug: row.parentSlug,
          sourceBlogPostId,
          reason: row.reason,
          priority: row.priority,
          commercialRelevance: row.commercialRelevance,
          internalLinkPotential: row.internalLinkPotential,
          cannibalizationRisk: row.cannibalizationRisk,
          status: "queued",
        },
      });
      saved += 1;
    }

    return { saved, skipped };
  }, { saved: 0, skipped: rows.length });
}

export async function getTopQueuedOpportunity(minPriority: number): Promise<{
  id: string;
  topic: string;
  cluster: string;
  type: string;
  pillar: string;
  parentTopic: string;
  reason: string;
  priority: number;
  commercialRelevance: number;
  internalLinkPotential: number;
  cannibalizationRisk: number;
} | null> {
  return withDb(async () => {
    const db = requireDb();
    const row = await db.topicOpportunity.findFirst({
      where: { status: "queued", priority: { gte: minPriority } },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });
    if (!row) return null;
    return {
      id: row.id,
      topic: row.topic,
      cluster: row.cluster,
      type: row.type,
      pillar: row.pillar,
      parentTopic: row.parentTopic,
      reason: row.reason,
      priority: row.priority,
      commercialRelevance: row.commercialRelevance,
      internalLinkPotential: row.internalLinkPotential,
      cannibalizationRisk: row.cannibalizationRisk,
    };
  }, null);
}

export async function markOpportunityPromoted(id: string): Promise<void> {
  await withDb(async () => {
    const db = requireDb();
    await db.topicOpportunity.update({
      where: { id },
      data: { status: "promoted" },
    });
  }, undefined);
}

export async function markOpportunityUsed(id: string): Promise<void> {
  await withDb(async () => {
    const db = requireDb();
    await db.topicOpportunity.update({
      where: { id },
      data: { status: "used" },
    });
  }, undefined);
}

export async function queuedOpportunityCount(): Promise<number> {
  return withDb(async () => {
    const db = requireDb();
    return db.topicOpportunity.count({ where: { status: "queued" } });
  }, 0);
}
