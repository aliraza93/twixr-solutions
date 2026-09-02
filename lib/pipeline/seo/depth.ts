import type { Brief } from "@prisma/client";
import {
  pickBlogFormat,
  BLOG_FORMATS,
  type BlogFormat,
} from "@/lib/pipeline/seo/formats";

export type DepthLevel = "short-take" | "standard" | "deep-dive";

export type DepthGuidance = {
  level: DepthLevel;
  format: BlogFormat;
  /** Soft target range - prefer usefulness inside this band; do not pad. */
  targetWordsMin: number;
  targetWordsMax: number;
  /** Hard floor used by validators (never invent length for SEO). */
  hardMinWords: number;
  faqTarget: string;
  reason: string;
  notes: string[];
};

function basePillar(pillar: string): string {
  if (/^code\s*card/i.test(pillar)) return "Code card";
  return pillar.split("/")[0]?.trim() || pillar;
}

/**
 * Recommend article depth from intent/complexity - not "longer = better".
 */
export function recommendArticleDepth(
  brief: Pick<
    Brief,
    "topic" | "angle" | "pillar" | "requiresLiveSource" | "targetKeyword"
  >,
  opts?: { formatOverride?: string }
): DepthGuidance {
  const overrideRaw = (opts?.formatOverride || "").trim();
  const overrideHit = BLOG_FORMATS.find(
    (f) => f.toLowerCase() === overrideRaw.toLowerCase()
  );
  const format =
    overrideHit ||
    pickBlogFormat({
      topic: brief.topic,
      angle: brief.angle,
      pillar: brief.pillar,
      requiresLiveSource: brief.requiresLiveSource,
    });
  const pillar = basePillar(brief.pillar);
  const hay = `${brief.topic} ${brief.angle || ""} ${brief.targetKeyword || ""}`.toLowerCase();

  const complex =
    /\b(architect|distributed|race|idempoten|horizon|kubernetes|ecs|multi-tenant|security|migrat|observab|transaction)\b/.test(
      hay
    );

  if (brief.requiresLiveSource || format === "Short Take" || pillar === "Code card") {
    return {
      level: "short-take",
      format,
      targetWordsMin: 500,
      targetWordsMax: 900,
      hardMinWords: 500,
      faqTarget: "3 focused FAQs",
      reason: overrideHit
        ? `Admin format override: ${format}.`
        : "Timely / code-card / short-take: sharp take + proof, not an encyclopedia.",
      notes: [
        "Lead with the builder's take.",
        "Do not pad with background the reader already knows.",
        "Prefer 3 tight sections over 8 thin ones.",
      ],
    };
  }

  if (pillar === "Business" && !complex) {
    return {
      level: "standard",
      format,
      targetWordsMin: 600,
      targetWordsMax: 1100,
      hardMinWords: 500,
      faqTarget: "3-4 FAQs",
      reason: "Business/positioning piece: practical and scannable.",
      notes: [
        "Outcome-first. One concrete playbook beat.",
        "Avoid fake thought leadership.",
      ],
    };
  }

  if (complex || format === "Teardown" || format === "Postmortem") {
    return {
      level: "deep-dive",
      format,
      targetWordsMin: 900,
      targetWordsMax: 1600,
      hardMinWords: 500,
      faqTarget: "4-5 FAQs",
      reason:
        "Technical complexity warrants depth - still stop when the problem is solved.",
      notes: [
        "Cover failure modes, tradeoffs, and a production-shaped example.",
        "Do not invent SERP competitors or word-count targets beyond this band.",
      ],
    };
  }

  return {
    level: "standard",
    format,
    targetWordsMin: 700,
    targetWordsMax: 1300,
    hardMinWords: 500,
    faqTarget: "3-5 FAQs",
    reason: "Standard peer-to-peer engineering article.",
    notes: [
      "Comprehensive usefulness over artificial length.",
      "If you hit the max and are repeating yourself, cut.",
    ],
  };
}

export function formatDepthGuidanceForPrompt(depth: DepthGuidance): string {
  return [
    "ARTICLE DEPTH (soft guidance - usefulness over padding):",
    `Level: ${depth.level}`,
    `Format: ${depth.format}`,
    `Soft word target: ${depth.targetWordsMin}-${depth.targetWordsMax} (hard minimum still ${depth.hardMinWords})`,
    `FAQs: ${depth.faqTarget}`,
    `Why: ${depth.reason}`,
    ...depth.notes.map((n) => `- ${n}`),
    "Never inflate word count for SEO. Cut filler.",
  ].join("\n");
}

/** Soft warnings only - never hard-fail publish by themselves. */
export function depthFitWarnings(
  body: string,
  depth: DepthGuidance
): string[] {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const warnings: string[] = [];
  if (words > depth.targetWordsMax + 250) {
    warnings.push(
      `Body may be padded (${words} words; soft max ~${depth.targetWordsMax} for ${depth.level})`
    );
  }
  if (words < depth.targetWordsMin - 100 && words >= depth.hardMinWords) {
    warnings.push(
      `Body under soft depth target (${words} words; aim ~${depth.targetWordsMin}+ for ${depth.level})`
    );
  }
  return warnings;
}
