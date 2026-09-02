import type { Brief } from "@prisma/client";
import { requireDb, withDb } from "@/lib/cms/db";
import { assessCannibalization } from "@/lib/pipeline/seo/cannibalization";
import {
  getSiteContentInventory,
} from "@/lib/pipeline/seo/inventory";
import type { InventoryItem } from "@/lib/pipeline/seo/types";
import { overlapScore, tokenize } from "@/lib/pipeline/seo/types";

export type DuplicateMatch = {
  kind: "blog" | "brief";
  title: string;
  url?: string;
  status?: string;
  score: number;
  reason: string;
};

export type DuplicateCheckResult = {
  blocked: boolean;
  risk: number;
  reason: string;
  matches: DuplicateMatch[];
};

/**
 * Pre-flight duplicate / cannibalization check for manual topics.
 */
export async function checkManualTopicDuplicate(input: {
  topic: string;
  targetKeyword?: string;
  angle?: string;
  pillar: string;
}): Promise<DuplicateCheckResult> {
  const inventory = await getSiteContentInventory();
  const briefLike: Pick<Brief, "topic" | "targetKeyword" | "angle" | "pillar"> =
    {
      topic: input.topic,
      targetKeyword: input.targetKeyword || input.topic,
      angle: input.angle || "",
      pillar: input.pillar,
    };

  const cannibal = assessCannibalization(briefLike, inventory);
  const matches: DuplicateMatch[] = [];

  if (cannibal.matched) {
    matches.push({
      kind: "blog",
      title: cannibal.matched.title,
      url: cannibal.matched.url,
      score: cannibal.matched.score,
      reason: cannibal.reason,
    });
  }

  // Near-match other blogs even below hard block threshold
  const topicTokens = tokenize(
    `${input.topic} ${input.targetKeyword || ""} ${input.angle || ""}`
  );
  for (const item of inventory.filter((i) => i.type === "blog")) {
    if (cannibal.matched?.url === item.url) continue;
    const score = overlapScore(
      topicTokens,
      tokenize(
        `${item.title} ${item.description} ${(item.tags || []).join(" ")}`
      )
    );
    if (score >= 0.55) {
      matches.push({
        kind: "blog",
        title: item.title,
        url: item.url,
        score: Number(score.toFixed(3)),
        reason: "Overlapping existing blog",
      });
    }
  }

  const briefMatches = await withDb(async () => {
    const db = requireDb();
    const briefs = await db.brief.findMany({
      where: { status: { in: ["queued", "used"] } },
      select: { topic: true, status: true, angle: true, pillar: true },
      take: 400,
    });
    const out: DuplicateMatch[] = [];
    for (const b of briefs) {
      const score = overlapScore(
        topicTokens,
        tokenize(`${b.topic} ${b.angle} ${b.pillar}`)
      );
      if (score >= 0.72) {
        out.push({
          kind: "brief",
          title: b.topic,
          status: b.status,
          score: Number(score.toFixed(3)),
          reason: `Similar brief (${b.status})`,
        });
      }
    }
    return out;
  }, [] as DuplicateMatch[]);

  matches.push(...briefMatches);

  matches.sort((a, b) => b.score - a.score);
  const top = matches.slice(0, 8);
  const blocked =
    cannibal.blocked ||
    top.some((m) => m.kind === "blog" && m.score >= 0.9);

  return {
    blocked,
    risk: Math.max(
      cannibal.risk,
      top[0]?.score ?? 0
    ),
    reason: blocked
      ? cannibal.blocked
        ? cannibal.reason
        : "Similar content already exists"
      : top.length
        ? "Related content found (not blocked)"
        : "No strong duplicate",
    matches: top,
  };
}

export function inventoryHasBlog(
  inventory: InventoryItem[],
  url: string
): boolean {
  return inventory.some((i) => i.type === "blog" && i.url === url);
}
