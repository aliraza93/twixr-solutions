import type { BlogDraft } from "@/lib/pipeline/generate-blog";
import type { CriticResult } from "@/lib/pipeline/critic";
import type { MetadataCheck } from "@/lib/pipeline/seo/metadata";
import type { RecommendedInternalLink } from "@/lib/pipeline/seo/types";
import { extractUrls } from "@/lib/pipeline/validators";
import { SITE_URL } from "@/lib/seo";

export type SeoScoreBreakdown = {
  technical: number; // /20
  searchIntent: number; // /15
  contentQuality: number; // /20
  topicalRelevance: number; // /15
  internalLinking: number; // /10
  metadata: number; // /10
  structuredDataReady: number; // /5 (FAQs present => ready for FAQ schema)
  originality: number; // /5
};

export type SeoReport = {
  total: number;
  max: 100;
  breakdown: SeoScoreBreakdown;
  hardFails: string[];
  warnings: string[];
  notes: string[];
};

function clamp(n: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(n)));
}

function countInternalLinks(body: string): number {
  const urls = extractUrls(body);
  const host = new URL(SITE_URL).hostname.replace(/^www\./, "");
  let n = 0;
  for (const u of urls) {
    try {
      const h = new URL(u, SITE_URL).hostname.replace(/^www\./, "");
      if (h === host) n += 1;
    } catch {
      if (u.startsWith("/")) n += 1;
    }
  }
  return n;
}

/**
 * Soft SEO quality score (informational). Does not block publish by itself.
 * Hard fails are listed separately for logging / email.
 */
export function buildSeoReport(input: {
  draft: BlogDraft;
  metadata: MetadataCheck;
  imageWarnings: string[];
  validatorReasons: string[];
  critic?: CriticResult;
  recommendedLinks: RecommendedInternalLink[];
  hasCover: boolean;
  inlineGenerated: number;
  cannibalizationRisk: number;
  /** Soft depth targets from Wave 5 (optional). */
  depthTargetMin?: number;
  depthTargetMax?: number;
}): SeoReport {
  const { draft, metadata, imageWarnings, validatorReasons, critic } = input;
  const hardFails = [
    ...metadata.hardFails,
    ...validatorReasons.filter((r) =>
      r.startsWith("Invented or disallowed internal link")
    ),
  ];
  const warnings = [
    ...metadata.warnings,
    ...imageWarnings,
    ...validatorReasons.filter(
      (r) => !r.startsWith("Invented or disallowed internal link")
    ),
  ];

  const words = draft.body.trim().split(/\s+/).filter(Boolean).length;
  const internalCount = countInternalLinks(draft.body);
  const faqCount = draft.faqs?.length ?? 0;
  const softMin = input.depthTargetMin ?? 500;
  const softMax = input.depthTargetMax ?? 1400;

  const technical = clamp(
    (metadata.ok ? 8 : 2) +
      (input.hasCover ? 4 : 0) +
      (input.inlineGenerated >= 2 ? 4 : input.inlineGenerated) +
      (hardFails.length === 0 ? 4 : 0),
    20
  );

  const searchIntent = clamp(
    (draft.searchIntent ? 6 : 3) +
      (draft.primaryKeyword ? 5 : 2) +
      (input.cannibalizationRisk < 0.7 ? 4 : 1),
    15
  );

  let contentQuality = 8;
  // Prefer landing inside the soft depth band over "longer is better".
  if (words >= Math.min(500, softMin)) contentQuality += 3;
  if (words >= softMin && words <= softMax + 100) contentQuality += 4;
  else if (words > softMax + 250) contentQuality += 1; // padded
  else if (words >= 700) contentQuality += 2;
  if (faqCount >= 3) contentQuality += 3;
  if (critic?.verdict === "pass") contentQuality += 2;
  contentQuality = clamp(contentQuality, 20);

  const topicalRelevance = clamp(
    (draft.contentCluster ? 5 : 2) +
      (draft.tags.length >= 3 ? 5 : 2) +
      (input.cannibalizationRisk < 0.85 ? 5 : 1),
    15
  );

  let internalLinking = 2;
  if (internalCount >= 1) internalLinking += 3;
  if (internalCount >= 2 && internalCount <= 6) internalLinking += 4;
  if (input.recommendedLinks.length > 0 && internalCount > 0) {
    internalLinking += 1;
  }
  if (internalCount > 8) internalLinking -= 3;
  internalLinking = clamp(internalLinking, 10);

  const metadataScore = clamp(
    (metadata.ok ? 5 : 1) +
      (metadata.warnings.length === 0 ? 3 : Math.max(0, 3 - metadata.warnings.length)) +
      (draft.excerpt.length >= 70 && draft.excerpt.length <= 160 ? 2 : 0),
    10
  );

  const structuredDataReady = clamp(faqCount >= 3 ? 5 : faqCount >= 1 ? 3 : 1, 5);

  const originality = clamp(
    input.cannibalizationRisk < 0.5
      ? 5
      : input.cannibalizationRisk < 0.85
        ? 3
        : 1,
    5
  );

  const breakdown: SeoScoreBreakdown = {
    technical,
    searchIntent,
    contentQuality,
    topicalRelevance,
    internalLinking,
    metadata: metadataScore,
    structuredDataReady,
    originality,
  };

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const notes: string[] = [
    `Words: ${words}`,
    `Soft depth band: ${softMin}-${softMax}`,
    `Internal links in body: ${internalCount}`,
    `FAQs: ${faqCount}`,
    `Recommended links offered: ${input.recommendedLinks.length}`,
    `Cover: ${input.hasCover ? "yes" : "no"}`,
    `Inline images: ${input.inlineGenerated}`,
    critic
      ? `Critic: ${critic.verdict} (${critic.score})`
      : "Critic: n/a",
  ];

  return {
    total,
    max: 100,
    breakdown,
    hardFails,
    warnings: [...new Set(warnings)].slice(0, 20),
    notes,
  };
}

export function formatSeoReportText(report: SeoReport): string {
  const b = report.breakdown;
  return [
    `SEO score: ${report.total}/${report.max}`,
    `  technical ${b.technical}/20 | intent ${b.searchIntent}/15 | content ${b.contentQuality}/20`,
    `  topical ${b.topicalRelevance}/15 | links ${b.internalLinking}/10 | meta ${b.metadata}/10`,
    `  schema-ready ${b.structuredDataReady}/5 | originality ${b.originality}/5`,
    report.hardFails.length
      ? `Hard fails: ${report.hardFails.join("; ")}`
      : "Hard fails: none",
    report.warnings.length
      ? `Warnings: ${report.warnings.slice(0, 5).join("; ")}`
      : "Warnings: none",
  ].join("\n");
}
