import type { BlogListing, BlogPost } from "@/content/blog-schema";
import { overlapScore, tokenize } from "@/lib/pipeline/seo/types";

export type RelatedCandidate = Pick<
  BlogListing,
  "slug" | "title" | "excerpt" | "category" | "tags"
> & {
  contentCluster?: string;
};

/**
 * Score related posts for the public "More posts" section.
 * Prefers same cluster, shared tags, category, then title/excerpt overlap.
 */
export function scoreRelatedPost(
  current: RelatedCandidate,
  candidate: RelatedCandidate
): number {
  if (current.slug === candidate.slug) return -1;

  let score = 0;
  const curCluster = (current.contentCluster || "").trim().toLowerCase();
  const candCluster = (candidate.contentCluster || "").trim().toLowerCase();
  if (curCluster && candCluster && curCluster === candCluster) {
    score += 0.45;
  }

  const curTags = new Set(
    (current.tags || []).map((t) => t.toLowerCase().trim()).filter(Boolean)
  );
  let tagHits = 0;
  for (const t of candidate.tags || []) {
    if (curTags.has(t.toLowerCase().trim())) tagHits += 1;
  }
  score += Math.min(0.4, tagHits * 0.14);

  if (
    current.category &&
    candidate.category &&
    current.category.toLowerCase() === candidate.category.toLowerCase()
  ) {
    score += 0.18;
  }

  const overlap = overlapScore(
    tokenize(`${current.title} ${current.excerpt} ${curCluster}`),
    tokenize(
      `${candidate.title} ${candidate.excerpt} ${candCluster} ${(candidate.tags || []).join(" ")}`
    )
  );
  score += overlap * 0.55;

  return score;
}

export function pickRelatedPosts<T extends RelatedCandidate>(
  current: RelatedCandidate | BlogPost,
  all: T[],
  limit = 3
): T[] {
  const scored = all
    .filter((p) => p.slug !== current.slug)
    .map((p) => ({ post: p, score: scoreRelatedPost(current, p) }))
    .filter((row) => row.score >= 0.12)
    .sort((a, b) => b.score - a.score);

  if (scored.length >= limit) {
    return scored.slice(0, limit).map((r) => r.post);
  }

  // Fallback: keep semantic hits, then fill with same category, then latest.
  const picked = new Set(scored.map((r) => r.post.slug));
  const out = scored.map((r) => r.post);
  const rest = all.filter((p) => p.slug !== current.slug && !picked.has(p.slug));
  const sameCat = rest.filter(
    (p) =>
      current.category &&
      p.category.toLowerCase() === current.category.toLowerCase()
  );
  for (const p of [...sameCat, ...rest]) {
    if (out.length >= limit) break;
    if (picked.has(p.slug)) continue;
    out.push(p);
    picked.add(p.slug);
  }
  return out.slice(0, limit);
}
