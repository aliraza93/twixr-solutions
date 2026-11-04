import {
  bannedPhrases,
  dashCheck,
  extractUrls,
  headingLevelCheck,
  lengthCheck,
  qualityGate,
  titleLengthCheck,
  unknownInternalLinks,
  validateLinkedIn,
} from "@/lib/pipeline/validators";

/**
 * The site's own quality gates, re-run on the stored draft before Jarvis may
 * approve, schedule or resume it. Jarvis never gets a path around them:
 *
 * - critic score present and at or above the hard floor (CRITIC_HARD_FLOOR),
 * - banned phrases and dash characters,
 * - heading, title and length rules,
 * - the publish quality gate (placeholders, FAQ answers, Sources, vague
 *   titles, empty alt text, live-source URLs),
 * - invented internal links against the live site inventory.
 *
 * The network dead-link check and the slug/topic duplicate checks ran at
 * generation time and are not repeated here (the duplicate checks would match
 * the draft itself).
 */

export type GateResult = { ok: boolean; reasons: string[] };

type Faq = { question: string; answer: string };

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

export function blogGate(
  post: {
    title: string;
    excerpt: string;
    body: string;
    tags: string[];
    faqs: unknown;
    criticScore: number | null;
  },
  brief: { requiresLiveSource: boolean } | null,
  opts: { criticFloor: number; internalAllowlist?: Set<string> }
): GateResult {
  const faqs = parseFaqs(post.faqs);
  const combined = [
    post.title,
    post.excerpt,
    post.body,
    ...post.tags,
    ...faqs.flatMap((f) => [f.question, f.answer]),
  ].join("\n");
  const sources = extractUrls(post.body).filter((u) => /^https?:\/\//i.test(u));

  const reasons = [
    ...criticReasons(post.criticScore, opts.criticFloor),
    ...bannedPhrases(combined),
    ...dashCheck(combined),
    ...lengthCheck(post.body, "blog"),
    ...headingLevelCheck(post.body),
    ...titleLengthCheck(post.title),
    ...qualityGate(
      { title: post.title, excerpt: post.excerpt, body: post.body, faqs, sources },
      { requiresLiveSource: brief?.requiresLiveSource ?? false }
    ),
    ...(opts.internalAllowlist?.size
      ? unknownInternalLinks(post.body, opts.internalAllowlist)
      : []),
  ];
  return { ok: reasons.length === 0, reasons };
}

export async function socialGate(
  post: { body: string; criticScore: number | null },
  blog: { published: boolean; reviewState: string; publishAt: Date | null } | null,
  scheduledFor: Date,
  opts: { criticFloor: number }
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
  return { ok: reasons.length === 0, reasons };
}
