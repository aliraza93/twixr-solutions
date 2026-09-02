import type { Brief } from "@prisma/client";
import type { InventoryItem } from "@/lib/pipeline/seo/types";
import { overlapScore, tokenize } from "@/lib/pipeline/seo/types";

export type CannibalizationResult = {
  blocked: boolean;
  risk: number;
  reason: string;
  matched?: { title: string; url: string; score: number };
};

function normalizeKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyLoose(text: string): string {
  return normalizeKey(text).replace(/\s+/g, "-");
}

/**
 * High-threshold duplicate-intent detection against existing blogs.
 * Blocks near-identical titles/slugs/topics; allows supporting angles.
 */
export function assessCannibalization(
  brief: Pick<Brief, "topic" | "targetKeyword" | "angle" | "pillar">,
  inventory: InventoryItem[]
): CannibalizationResult {
  const blogs = inventory.filter((i) => i.type === "blog");
  if (!blogs.length) {
    return { blocked: false, risk: 0, reason: "No existing blogs to compare" };
  }

  const topic = brief.topic.trim();
  const keyword = (brief.targetKeyword || topic).trim();
  const topicNorm = normalizeKey(topic);
  const keywordNorm = normalizeKey(keyword);
  const topicSlug = slugifyLoose(topic);
  const keywordSlug = slugifyLoose(keyword);
  const topicTokens = tokenize(`${topic} ${keyword} ${brief.angle || ""}`);

  let best: { title: string; url: string; score: number } | undefined;

  for (const blog of blogs) {
    const titleNorm = normalizeKey(blog.title);
    const pathSlug = blog.path.replace(/^\/blog\//, "");
    const excerptNorm = normalizeKey(blog.description || "");
    const blogTokens = tokenize(
      `${blog.title} ${blog.description} ${(blog.tags || []).join(" ")}`
    );

    let score = 0;

    if (titleNorm === topicNorm || titleNorm === keywordNorm) score = 1;
    else if (
      titleNorm.includes(topicNorm) ||
      topicNorm.includes(titleNorm) ||
      titleNorm.includes(keywordNorm)
    ) {
      score = Math.max(score, 0.92);
    }

    if (
      pathSlug === topicSlug ||
      pathSlug === keywordSlug ||
      pathSlug.includes(topicSlug) ||
      topicSlug.includes(pathSlug)
    ) {
      score = Math.max(score, 0.95);
    }

    const overlap = overlapScore(topicTokens, blogTokens);
    if (overlap >= 0.72) score = Math.max(score, overlap);

    // Excerpt that restates the same topic phrase
    if (
      topicNorm.length >= 12 &&
      (excerptNorm.includes(topicNorm) || excerptNorm.includes(keywordNorm))
    ) {
      score = Math.max(score, 0.88);
    }

    if (!best || score > best.score) {
      best = { title: blog.title, url: blog.url, score };
    }
  }

  const risk = best?.score ?? 0;
  // Block only high-confidence duplicates
  if (risk >= 0.9 && best) {
    return {
      blocked: true,
      risk,
      reason: `Near-duplicate intent vs "${best.title}" (${best.url})`,
      matched: best,
    };
  }

  return {
    blocked: false,
    risk,
    reason:
      risk >= 0.7 && best
        ? `Related to "${best.title}" but distinct enough to proceed`
        : "No high-risk cannibalization detected",
    matched: best,
  };
}
