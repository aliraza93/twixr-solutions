import { randomInt } from "node:crypto";
import type { Brief } from "@prisma/client";
import { requireDb, withDb } from "@/lib/cms/db";
import { pipeline } from "@/lib/pipeline/config";
import {
  getTopQueuedOpportunity,
  markOpportunityPromoted,
  markOpportunityUsed,
} from "@/lib/pipeline/seo/opportunity-store";

export type BasePillar = "Build" | "Business" | "Timely" | "Code card";

export type NextBriefResult = {
  brief: Brief;
  /** Set when this brief was promoted from a TopicOpportunity. */
  opportunityId?: string;
  opportunityPriority?: number;
};

const BASE_PILLARS: BasePillar[] = ["Build", "Business", "Timely", "Code card"];

/** Map `Build/Laravel` -> `Build`, `Code card/...` -> `Code card`. */
export function basePillarOf(pillar: string): BasePillar {
  const raw = pillar.trim();
  if (/^code\s*card/i.test(raw)) return "Code card";
  const head = raw.split("/")[0]?.trim() ?? raw;
  const hit = BASE_PILLARS.find(
    (p) => p.toLowerCase() === head.toLowerCase()
  );
  return hit ?? "Build";
}

function weightFor(base: BasePillar): number {
  const w = pipeline.pillarWeights;
  switch (base) {
    case "Build":
      return w.build;
    case "Business":
      return w.business;
    case "Timely":
      return w.timely;
    case "Code card":
      return w.codeCard;
  }
}

function pickWeighted(options: Array<{ key: string; weight: number }>): string {
  const positive = options.map((o) => ({
    key: o.key,
    weight: Math.max(0, o.weight),
  }));
  const total = positive.reduce((sum, o) => sum + o.weight, 0);
  if (total <= 0) {
    return positive[randomInt(positive.length)].key;
  }
  // Scale so fractional env weights still work.
  const scale = 1000;
  let roll = randomInt(Math.max(1, Math.round(total * scale)));
  for (const o of positive) {
    roll -= Math.round(o.weight * scale);
    if (roll < 0) return o.key;
  }
  return positive[positive.length - 1].key;
}

async function recentBasePillars(limit: number): Promise<BasePillar[]> {
  const db = requireDb();
  const used = await db.brief.findMany({
    where: { status: "used", usedAt: { not: null } },
    orderBy: { usedAt: "desc" },
    take: limit,
    select: { pillar: true },
  });
  return used.map((b) => basePillarOf(b.pillar));
}

/**
 * Promote a high-score TopicOpportunity into a Brief when prefer is enabled.
 */
async function tryPromoteOpportunity(): Promise<NextBriefResult | null> {
  if (!pipeline.seoEnabled || !pipeline.seoOpportunityPrefer) return null;

  const opp = await getTopQueuedOpportunity(pipeline.seoOpportunityMinPriority);
  if (!opp) return null;

  const pillar =
    opp.pillar.trim() ||
    (opp.cluster ? `Build/${opp.cluster}` : "Build");

  const brief = await withDb(async () => {
    const db = requireDb();
    return db.brief.create({
      data: {
        pillar,
        topic: opp.topic,
        targetKeyword: opp.topic,
        angle: opp.reason.slice(0, 280),
        realExample: opp.parentTopic
          ? `Follow-up from: ${opp.parentTopic}`
          : "",
        requiresLiveSource: false,
        status: "queued",
      },
    });
  }, null);

  if (!brief) return null;

  await markOpportunityPromoted(opp.id);
  return {
    brief,
    opportunityId: opp.id,
    opportunityPriority: opp.priority,
  };
}

async function takeWeightedBankBrief(): Promise<Brief | null> {
  const db = requireDb();
  const now = new Date();
  const dueFilter = {
    status: "queued" as const,
    OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
  };

  const queued = await db.brief.findMany({
    where: dueFilter,
    orderBy: { createdAt: "asc" },
    select: { id: true, pillar: true, createdAt: true },
  });
  if (queued.length === 0) return null;

  const byBase = new Map<BasePillar, typeof queued>();
  for (const row of queued) {
    const base = basePillarOf(row.pillar);
    const list = byBase.get(base) ?? [];
    list.push(row);
    byBase.set(base, list);
  }

  let available = [...byBase.keys()];
  const recent = await recentBasePillars(2);
  if (
    recent.length >= 2 &&
    recent[0] === recent[1] &&
    available.length > 1
  ) {
    const streak = recent[0];
    const without = available.filter((p) => p !== streak);
    if (without.length) available = without;
  }

  const chosenBase = pickWeighted(
    available.map((key) => ({ key, weight: weightFor(key) }))
  ) as BasePillar;

  const inPillar = byBase.get(chosenBase) ?? [];
  if (inPillar.length === 0) {
    return db.brief.findFirst({
      where: dueFilter,
      orderBy: { createdAt: "asc" },
    });
  }

  let candidates = inPillar;
  if (chosenBase === "Build") {
    const subsections = [...new Set(inPillar.map((b) => b.pillar))];
    const subsection = subsections[randomInt(subsections.length)];
    candidates = inPillar.filter((b) => b.pillar === subsection);
  }

  const oldest = candidates[0];
  return db.brief.findUnique({ where: { id: oldest.id } });
}

/**
 * Prefer a high-score content-gap opportunity, else weighted topic-bank brief.
 */
export async function takeNextBrief(): Promise<NextBriefResult | null> {
  const promoted = await tryPromoteOpportunity();
  if (promoted) return promoted;

  const brief = await takeWeightedBankBrief();
  if (!brief) return null;
  return { brief };
}

export async function markBriefUsed(id: string): Promise<void> {
  const db = requireDb();
  await db.brief.update({
    where: { id },
    data: { status: "used", usedAt: new Date() },
  });
}

export async function markBriefSkipped(id: string): Promise<void> {
  const db = requireDb();
  await db.brief.update({
    where: { id },
    data: { status: "skipped", usedAt: new Date() },
  });
}

export async function remainingBriefCount(): Promise<number> {
  return withDb(async () => {
    const db = requireDb();
    return db.brief.count({ where: { status: "queued" } });
  }, 0);
}

export { markOpportunityUsed };
