import type { Brief } from "@prisma/client";
import {
  overlinkPenalty,
  type ContentGraph,
} from "@/lib/pipeline/seo/graph";
import type {
  InventoryItem,
  RecommendedInternalLink,
} from "@/lib/pipeline/seo/types";
import { overlapScore, tokenize } from "@/lib/pipeline/seo/types";

function suggestedAnchor(item: InventoryItem): string {
  const title = item.title.trim();
  if (title.length <= 60) return title;
  return `${title.slice(0, 57).replace(/\s+\S*$/, "").trim()}...`;
}

function scoreItem(
  item: InventoryItem,
  queryTokens: Set<string>,
  pillarHint: string,
  graph?: ContentGraph
): number {
  const itemTokens = tokenize(
    [
      item.title,
      item.description,
      item.category || "",
      ...(item.tags || []),
      ...(item.topics || []),
    ].join(" ")
  );
  let score = overlapScore(queryTokens, itemTokens);

  const pillar = pillarHint.toLowerCase();
  const hay = `${item.title} ${item.description} ${(item.tags || []).join(" ")}`.toLowerCase();

  if (pillar.includes("laravel") && hay.includes("laravel")) score += 0.12;
  if (pillar.includes("nest") && (hay.includes("nest") || hay.includes("node")))
    score += 0.1;
  if (pillar.includes("aws") && (hay.includes("aws") || hay.includes("devops")))
    score += 0.1;
  if (
    (pillar.includes("ai") || pillar.includes("llm") || pillar.includes("mcp")) &&
    (hay.includes("ai") || hay.includes("mcp") || hay.includes("llm"))
  ) {
    score += 0.12;
  }
  if (pillar.includes("seo") && hay.includes("seo")) score += 0.1;
  if (pillar.includes("upwork") || pillar.includes("freelance")) {
    if (hay.includes("upwork") || hay.includes("freelance")) score += 0.1;
  }

  // Prefer commercial pages slightly when relevance exists
  if (item.type === "service" && score >= 0.12) score += 0.05;
  if (item.type === "portfolio" && score >= 0.12) score += 0.03;

  // Soft boost for orphans (inbound 0) so discovery can improve over time
  if (graph) {
    const inbound = graph.inboundByPath.get(item.path) || 0;
    if (
      inbound === 0 &&
      (item.type === "service" || item.type === "portfolio")
    ) {
      if (score >= 0.11) score += 0.04;
    }
    score -= overlinkPenalty(item.url, graph);
  }

  // Deprioritize generic marketing pages
  if (item.type === "page") score *= 0.35;

  return score;
}

/**
 * Build a verified internal-link plan from inventory only.
 * Guidelines: prefer ~1 service + 0-1 portfolio when relevant, plus 1-4 blogs.
 * Never invent URLs; never force commercial links below relevance threshold.
 * Uses content-graph balance when provided (orphan boost / overlink penalty).
 */
export function buildInternalLinkPlan(
  brief: Pick<Brief, "topic" | "targetKeyword" | "pillar" | "angle">,
  inventory: InventoryItem[],
  opts?: {
    maxTotal?: number;
    preferCommercial?: boolean;
    graph?: ContentGraph;
  }
): RecommendedInternalLink[] {
  const maxTotal = opts?.maxTotal ?? 6;
  const preferCommercial = opts?.preferCommercial !== false;
  const graph = opts?.graph;
  const queryTokens = tokenize(
    `${brief.topic} ${brief.targetKeyword || ""} ${brief.pillar} ${brief.angle || ""}`
  );

  const scored = inventory
    .map((item) => ({
      item,
      score: scoreItem(item, queryTokens, brief.pillar, graph),
    }))
    .filter((row) => {
      if (
        preferCommercial &&
        (row.item.type === "service" || row.item.type === "portfolio")
      ) {
        return row.score >= 0.11;
      }
      return row.score >= 0.14;
    })
    .sort((a, b) => {
      if (preferCommercial) {
        const aBoost =
          a.item.type === "service"
            ? 0.04
            : a.item.type === "portfolio"
              ? 0.02
              : 0;
        const bBoost =
          b.item.type === "service"
            ? 0.04
            : b.item.type === "portfolio"
              ? 0.02
              : 0;
        return b.score + bBoost - (a.score + aBoost);
      }
      return b.score - a.score;
    });

  const picked: RecommendedInternalLink[] = [];
  let services = 0;
  let portfolios = 0;
  let blogs = 0;

  for (const row of scored) {
    if (picked.length >= maxTotal) break;
    const { item, score } = row;
    if (item.type === "service") {
      if (services >= 1) continue;
      services += 1;
    } else if (item.type === "portfolio") {
      if (portfolios >= 1) continue;
      portfolios += 1;
    } else if (item.type === "blog") {
      if (blogs >= 4) continue;
      blogs += 1;
    } else {
      continue;
    }

    picked.push({
      url: item.url,
      path: item.path,
      title: item.title,
      type: item.type,
      suggestedAnchor: suggestedAnchor(item),
      score: Number(score.toFixed(3)),
    });
  }

  return picked;
}

export function formatLinkPlanForPrompt(
  links: RecommendedInternalLink[]
): string {
  if (!links.length) {
    return [
      "INTERNAL LINKS: none strongly relevant.",
      "Do not invent URLs. You may omit internal links if none fit.",
    ].join("\n");
  }

  const commercial = links.filter(
    (l) => l.type === "service" || l.type === "portfolio"
  );
  const blogs = links.filter((l) => l.type === "blog");

  const lines = links.map(
    (l, i) =>
      `${i + 1}. [${l.type}] ${l.title} -> ${l.url} (suggested anchor: "${l.suggestedAnchor}")`
  );

  return [
    "ALLOWED INTERNAL LINKS (use only these URLs - never invent paths):",
    ...lines,
    "",
    "Linking rules:",
    "- Use 2-6 markdown links from this list when they help the reader.",
    "- Natural anchor text (not \"click here\").",
    commercial.length
      ? `- Commercial / evidence pages available (${commercial
          .map((c) => c.type)
          .join(", ")}): link only when the reader would benefit - never force.`
      : "- No commercial/portfolio URL cleared relevance for this brief.",
    blogs.length
      ? `- Related blog posts: ${blogs.length} allowed.`
      : "- No strongly related blog URLs for this brief.",
    "- Do not link the same URL more than once.",
  ].join("\n");
}
