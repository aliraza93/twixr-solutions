import type { BlogDraft } from "@/lib/pipeline/generate-blog";
import { assessBlogMetadata } from "@/lib/pipeline/seo/metadata";
import {
  bannedPhrases,
  dashCheck,
  extractUrls,
  headingLevelCheck,
  lengthCheck,
  qualityGate,
  sourcesRequired,
  titleLengthCheck,
  unknownInternalLinks,
  validateLinkedIn,
} from "@/lib/pipeline/validators";

/**
 * The site's own quality gates, re-run on the stored draft before Jarvis may
 * approve, schedule or resume it. Jarvis never gets a path around them:
 *
 * - critic score present and at or above the hard floor (CRITIC_HARD_FLOOR),
 * - metadata hard fails (empty title, excerpt or slug; unclean or long slug),
 *   the same check that sets seoHardFail in run-generate,
 * - banned phrases and dash characters,
 * - heading, title and length rules,
 * - sources for live-source briefs and the publish quality gate
 *   (placeholders, FAQ answers, Sources, vague titles, empty alt text,
 *   live-source URLs),
 * - a cover image,
 * - invented internal links against the live site inventory.
 *
 * Some checks ran at generation and cannot be repeated here: the network
 * dead-link check, and the slug, title and topic duplicate checks (they would
 * match the draft itself). If the stored review reasons carry one of those,
 * or the critic score sits between the hard floor and CRITIC_MIN_SCORE, the
 * draft passes the gate only with an explicit override (`needsOverride`).
 */

export type GateResult = {
  ok: boolean;
  /** Hard failures: no override can pass these. */
  reasons: string[];
  /** Earlier findings the gate cannot re-check; passable only with override. */
  needsOverride: string[];
};

type Faq = { question: string; answer: string };

const UNRECHECKABLE: RegExp[] = [
  /^Dead or unreachable link/,
  /^Slug already exists/,
  /^Duplicate title/,
  /^Topic already used/,
  /^Topic appears in an existing post title/,
  // The first post may already be live on LinkedIn: only Ali can clear this.
  /^LinkedIn publish not confirmed/,
];

function parseFaqs(raw: unknown): Faq[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f): f is Record<string, unknown> => Boolean(f) && typeof f === "object")
    .map((f) => ({ question: String(f.question ?? ""), answer: String(f.answer ?? "") }));
}

function criticReasons(score: number | null, floor: number): string[] {
  if (score === null || score === undefined) {
    return ["No critic score recorded; the critic must pass before publishing"];
  }
  return score < floor ? [`critic score ${score} below hard floor ${floor}`] : [];
}

function overrideReasons(
  storedReasons: unknown,
  score: number | null,
  opts: { criticFloor: number; criticMinScore: number }
): string[] {
  const stored = Array.isArray(storedReasons) ? storedReasons.map(String) : [];
  const out = stored.filter((r) => UNRECHECKABLE.some((re) => re.test(r)));
  if (score !== null && score >= opts.criticFloor && score < opts.criticMinScore) {
    out.push(`critic score ${score} below minimum ${opts.criticMinScore}`);
  }
  return out;
}

function result(reasons: string[], needsOverride: string[]): GateResult {
  return { ok: reasons.length === 0, reasons, needsOverride };
}

export type GateOptions = {
  criticFloor: number;
  criticMinScore: number;
  internalAllowlist?: Set<string>;
};

export function blogGate(
  post: {
    slug: string;
    title: string;
    excerpt: string;
    body: string;
    image: string;
    tags: string[];
    faqs: unknown;
    criticScore: number | null;
    reviewReasons: unknown;
    /** Declared sources (intake); joined with the http(s) URLs in the body. */
    sources?: string[];
  },
  brief: { requiresLiveSource: boolean } | null,
  opts: GateOptions
): GateResult {
  const faqs = parseFaqs(post.faqs);
  const combined = [
    post.title,
    post.excerpt,
    post.body,
    ...post.tags,
    ...faqs.flatMap((f) => [f.question, f.answer]),
  ].join("\n");
  const sources = [
    ...new Set([...extractUrls(post.body), ...(post.sources ?? [])]),
  ].filter((u) => /^https?:\/\//i.test(u));
  const liveSource = { requiresLiveSource: brief?.requiresLiveSource ?? false };
  const draft: BlogDraft = {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: "",
    tags: post.tags,
    readingTime: "",
    body: post.body,
    faqs,
    coverAlt: "",
    inlineImagePrompts: [],
    sources,
  };

  const reasons = [
    ...criticReasons(post.criticScore, opts.criticFloor),
    ...assessBlogMetadata(draft).hardFails,
    ...bannedPhrases(combined),
    ...dashCheck(combined),
    ...lengthCheck(post.body, "blog"),
    ...headingLevelCheck(post.body),
    ...titleLengthCheck(post.title),
    ...sourcesRequired(draft, liveSource),
    ...qualityGate(draft, liveSource),
    ...(post.image.trim() ? [] : ["Cover image missing"]),
    ...(opts.internalAllowlist?.size
      ? unknownInternalLinks(post.body, opts.internalAllowlist)
      : []),
  ];
  return result(reasons, overrideReasons(post.reviewReasons, post.criticScore, opts));
}

export async function socialGate(
  post: { body: string; criticScore: number | null; reviewReasons: unknown },
  blog: { published: boolean; reviewState: string; publishAt: Date | null } | null,
  scheduledFor: Date,
  opts: GateOptions
): Promise<GateResult> {
  const validation = await validateLinkedIn(post.body);
  const reasons = [...criticReasons(post.criticScore, opts.criticFloor), ...validation.reasons];

  // The LinkedIn post links to its blog, so the blog must be live (or
  // approved to go live) no later than the post.
  if (blog && !blog.published) {
    if (blog.reviewState !== "approved" || !blog.publishAt) {
      reasons.push("Linked blog is not approved to publish yet");
    } else if (blog.publishAt.getTime() > scheduledFor.getTime()) {
      reasons.push(
        `Linked blog goes live at ${blog.publishAt.toISOString()}, after this post`
      );
    }
  }
  return result(reasons, overrideReasons(post.reviewReasons, post.criticScore, opts));
}
