import type { Brief } from "@prisma/client";
import type { BlogDraft } from "@/lib/pipeline/generate-blog";
import { assessCannibalization } from "@/lib/pipeline/seo/cannibalization";
import type { InventoryItem } from "@/lib/pipeline/seo/types";
import { overlapScore, tokenize } from "@/lib/pipeline/seo/types";

export type OpportunityType =
  | "pillar"
  | "supporting"
  | "related"
  | "commercial"
  | "deep-dive"
  | "comparison"
  | "faq";

export type ScoredOpportunity = {
  topic: string;
  cluster: string;
  type: OpportunityType;
  pillar: string;
  parentTopic: string;
  parentSlug: string;
  reason: string;
  priority: number;
  commercialRelevance: number;
  internalLinkPotential: number;
  cannibalizationRisk: number;
};

export type ContentGapReport = {
  cluster: string;
  existingInCluster: string[];
  missingSuggestions: string[];
  serviceHints: Array<{ title: string; url: string; score: number }>;
  portfolioHints: Array<{ title: string; url: string; score: number }>;
  notes: string[];
};

const SUPPORTING_ANGLES = [
  "production pitfalls and recovery",
  "debugging and observability",
  "retries and failure modes",
  "performance and scaling tradeoffs",
  "security and abuse prevention",
  "testing strategies that catch regressions",
  "migration and rollout checklist",
];

function normalizeTopic(text: string): string {
  return text
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clusterLabel(
  draftOrBrief: { contentCluster?: string; pillar?: string; tags?: string[] },
  brief?: Pick<Brief, "pillar" | "topic">
): string {
  if (draftOrBrief.contentCluster?.trim()) return draftOrBrief.contentCluster.trim();
  const pillar = draftOrBrief.pillar || brief?.pillar || "";
  const sub = pillar.split("/")[1]?.trim();
  if (sub) return sub;
  if (draftOrBrief.tags?.[0]) return draftOrBrief.tags[0];
  return brief?.topic?.split(/\s+/).slice(0, 3).join(" ") || "General";
}

function blogsInCluster(
  inventory: InventoryItem[],
  cluster: string
): InventoryItem[] {
  const cTokens = tokenize(cluster);
  return inventory.filter((i) => {
    if (i.type !== "blog") return false;
    const hay = tokenize(
      `${i.title} ${i.description} ${(i.tags || []).join(" ")} ${i.category || ""}`
    );
    return overlapScore(cTokens, hay) >= 0.22;
  });
}

function commercialScore(
  topic: string,
  inventory: InventoryItem[]
): { score: number; bestService?: InventoryItem; bestPortfolio?: InventoryItem } {
  const q = tokenize(topic);
  let bestService: InventoryItem | undefined;
  let bestServiceScore = 0;
  let bestPortfolio: InventoryItem | undefined;
  let bestPortfolioScore = 0;

  for (const item of inventory) {
    if (item.type !== "service" && item.type !== "portfolio") continue;
    const s = overlapScore(
      q,
      tokenize(
        `${item.title} ${item.description} ${(item.tags || []).join(" ")}`
      )
    );
    if (item.type === "service" && s > bestServiceScore) {
      bestServiceScore = s;
      bestService = item;
    }
    if (item.type === "portfolio" && s > bestPortfolioScore) {
      bestPortfolioScore = s;
      bestPortfolio = item;
    }
  }

  const score = clampScore(
    bestServiceScore * 70 + bestPortfolioScore * 40 + (bestServiceScore >= 0.18 ? 15 : 0)
  );
  return { score, bestService, bestPortfolio };
}

function linkPotential(
  topic: string,
  inventory: InventoryItem[],
  cluster: string
): number {
  const neighbors = blogsInCluster(inventory, cluster).length;
  const q = tokenize(topic);
  let related = 0;
  for (const b of inventory.filter((i) => i.type === "blog")) {
    if (
      overlapScore(
        q,
        tokenize(`${b.title} ${b.description} ${(b.tags || []).join(" ")}`)
      ) >= 0.2
    ) {
      related += 1;
    }
  }
  return clampScore(neighbors * 12 + related * 8 + (related >= 2 ? 20 : 0));
}

function opportunityCannibalRisk(
  topic: string,
  inventory: InventoryItem[],
  pillar: string
): number {
  const result = assessCannibalization(
    {
      topic,
      targetKeyword: topic,
      angle: "",
      pillar,
    },
    inventory
  );
  return clampScore(result.risk * 100);
}

function scoreOpportunity(input: {
  topic: string;
  cluster: string;
  type: OpportunityType;
  pillar: string;
  parentTopic: string;
  parentSlug: string;
  reason: string;
  inventory: InventoryItem[];
}): ScoredOpportunity {
  const commercial = commercialScore(input.topic, input.inventory);
  const internalLinkPotential = linkPotential(
    input.topic,
    input.inventory,
    input.cluster
  );
  const cannibalizationRisk = opportunityCannibalRisk(
    input.topic,
    input.inventory,
    input.pillar
  );

  // Prefer supporting cluster fill + commercial relevance; penalize near-dupes.
  const priority = clampScore(
    35 +
      commercial.score * 0.25 +
      internalLinkPotential * 0.35 +
      (input.type === "supporting" ? 8 : 0) +
      (input.type === "commercial" ? 5 : 0) -
      cannibalizationRisk * 0.55
  );

  return {
    topic: input.topic,
    cluster: input.cluster,
    type: input.type,
    pillar: input.pillar,
    parentTopic: input.parentTopic,
    parentSlug: input.parentSlug,
    reason: input.reason,
    priority,
    commercialRelevance: commercial.score,
    internalLinkPotential,
    cannibalizationRisk,
  };
}

/**
 * Lightweight content-gap snapshot for the current brief (CPU-only).
 */
export function detectContentGaps(
  brief: Pick<Brief, "topic" | "targetKeyword" | "pillar" | "angle">,
  inventory: InventoryItem[]
): ContentGapReport {
  const cluster = clusterLabel({ pillar: brief.pillar }, brief);
  const existing = blogsInCluster(inventory, cluster);
  const existingTitles = existing.map((b) => b.title);

  const base = (brief.targetKeyword || brief.topic).trim();
  const missingSuggestions: string[] = [];
  for (const angle of SUPPORTING_ANGLES) {
    const topic = `${base}: ${angle}`;
    const risk = opportunityCannibalRisk(topic, inventory, brief.pillar);
    if (risk >= 85) continue;
    const already = existingTitles.some(
      (t) => normalizeTopic(t).includes(normalizeTopic(angle).slice(0, 18))
    );
    if (already) continue;
    missingSuggestions.push(topic);
    if (missingSuggestions.length >= 5) break;
  }

  const commercial = commercialScore(
    `${brief.topic} ${brief.targetKeyword || ""}`,
    inventory
  );
  const serviceHints = commercial.bestService
    ? [
        {
          title: commercial.bestService.title,
          url: commercial.bestService.url,
          score: Number(
            overlapScore(
              tokenize(`${brief.topic} ${brief.targetKeyword || ""}`),
              tokenize(
                `${commercial.bestService.title} ${commercial.bestService.description}`
              )
            ).toFixed(3)
          ),
        },
      ]
    : [];
  const portfolioHints = commercial.bestPortfolio
    ? [
        {
          title: commercial.bestPortfolio.title,
          url: commercial.bestPortfolio.url,
          score: Number(
            overlapScore(
              tokenize(`${brief.topic} ${brief.targetKeyword || ""}`),
              tokenize(
                `${commercial.bestPortfolio.title} ${commercial.bestPortfolio.description}`
              )
            ).toFixed(3)
          ),
        },
      ]
    : [];

  const notes: string[] = [
    `Cluster "${cluster}" has ${existing.length} existing blog(s)`,
    missingSuggestions.length
      ? `${missingSuggestions.length} supporting gap(s) suggested`
      : "No clear supporting gaps from templates",
    serviceHints.length
      ? `Commercial service match: ${serviceHints[0].title}`
      : "No strong service match",
    portfolioHints.length
      ? `Portfolio evidence match: ${portfolioHints[0].title}`
      : "No strong portfolio match",
  ];

  return {
    cluster,
    existingInCluster: existingTitles.slice(0, 8),
    missingSuggestions,
    serviceHints,
    portfolioHints,
    notes,
  };
}

/**
 * After a post is written, expand 5-8 scored follow-up opportunities (no LLM).
 */
export function expandTopicOpportunities(input: {
  draft: BlogDraft;
  brief: Pick<Brief, "pillar" | "topic">;
  inventory: InventoryItem[];
  parentSlug: string;
}): ScoredOpportunity[] {
  const { draft, brief, inventory, parentSlug } = input;
  const cluster = clusterLabel(
    { contentCluster: draft.contentCluster, tags: draft.tags, pillar: brief.pillar },
    brief
  );
  const parentTopic = draft.title || brief.topic;
  const seeds: Array<{ topic: string; type: OpportunityType; reason: string }> =
    [];

  for (const angle of SUPPORTING_ANGLES.slice(0, 5)) {
    seeds.push({
      topic: `${cluster}: ${angle}`,
      type: "supporting",
      reason: `Supporting article to deepen the ${cluster} cluster after "${parentTopic}".`,
    });
  }

  if (draft.tags.length) {
    const tag = draft.tags[0];
    seeds.push({
      topic: `${tag} comparison guide for production teams`,
      type: "comparison",
      reason: `Comparison follow-up from tag "${tag}" on "${parentTopic}".`,
    });
    seeds.push({
      topic: `FAQ: common ${tag} failures in production`,
      type: "faq",
      reason: `FAQ/problem-solving expansion for ${tag}.`,
    });
  }

  const commercial = commercialScore(
    `${draft.title} ${draft.primaryKeyword || ""} ${(draft.tags || []).join(" ")}`,
    inventory
  );
  if (commercial.bestService && commercial.score >= 35) {
    seeds.push({
      topic: `How ${cluster} maps to ${commercial.bestService.title}`,
      type: "commercial",
      reason: `Commercial bridge to verified service "${commercial.bestService.title}".`,
    });
  }
  if (commercial.bestPortfolio && commercial.score >= 30) {
    seeds.push({
      topic: `Lessons from building ${commercial.bestPortfolio.title}`,
      type: "related",
      reason: `Portfolio evidence bridge to "${commercial.bestPortfolio.title}".`,
    });
  }

  const seen = new Set<string>();
  const scored: ScoredOpportunity[] = [];

  for (const seed of seeds) {
    const key = normalizeTopic(seed.topic);
    if (seen.has(key) || key.length < 12) continue;
    seen.add(key);

    const row = scoreOpportunity({
      topic: seed.topic,
      cluster,
      type: seed.type,
      pillar: brief.pillar,
      parentTopic,
      parentSlug,
      reason: seed.reason,
      inventory,
    });

    // Skip near-duplicates of existing posts
    if (row.cannibalizationRisk >= 85) continue;
    scored.push(row);
  }

  return scored.sort((a, b) => b.priority - a.priority).slice(0, 8);
}

export function formatGapReportForPrompt(gap: ContentGapReport): string {
  const lines = [
    "CONTENT GAP CONTEXT (informational - write ONE article only):",
    `Cluster: ${gap.cluster}`,
    gap.existingInCluster.length
      ? `Existing in cluster: ${gap.existingInCluster.join("; ")}`
      : "Existing in cluster: (none yet)",
    gap.missingSuggestions.length
      ? `Known gaps (do not cover all; stay on today's brief): ${gap.missingSuggestions
          .slice(0, 3)
          .join("; ")}`
      : "",
    gap.serviceHints.length
      ? `Natural commercial page if relevant: ${gap.serviceHints[0].title} (${gap.serviceHints[0].url})`
      : "",
    gap.portfolioHints.length
      ? `Natural portfolio evidence if relevant: ${gap.portfolioHints[0].title} (${gap.portfolioHints[0].url})`
      : "",
    "Never invent URLs. Only link URLs from the ALLOWED INTERNAL LINKS list.",
  ];
  return lines.filter(Boolean).join("\n");
}
