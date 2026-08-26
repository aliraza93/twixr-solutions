import { BANNED_PHRASES } from "@/content/pipeline/banned-phrases";
import { requireDb, withDb } from "@/lib/cms/db";
import type { BlogDraft } from "@/lib/pipeline/generate-blog";
import type { Brief } from "@prisma/client";

export type ValidationResult = { ok: boolean; reasons: string[] };

const DASH_CHARS = /[\u2014\u2013\u2212]/;
const DASH_ENTITIES = /&mdash;|&ndash;/i;

export function bannedPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      hits.push(`Banned phrase: ${phrase}`);
    }
  }
  return hits;
}

export function dashCheck(text: string): string[] {
  const reasons: string[] = [];
  if (DASH_CHARS.test(text)) {
    reasons.push("Contains em/en dash or minus sign (U+2014/U+2013/U+2212)");
  }
  if (DASH_ENTITIES.test(text)) {
    reasons.push("Contains HTML dash entity (&mdash; or &ndash;)");
  }
  return reasons;
}

export function hashtagCheck(text: string): string[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const last = lines[lines.length - 1] ?? "";
  const tags = last.match(/#[\w]+/g) ?? [];
  if (tags.length < 4 || tags.length > 6) {
    return [
      `Hashtag line must have 4-6 tags (found ${tags.length}): "${last.slice(0, 80)}"`,
    ];
  }
  return [];
}

export function lengthCheck(
  text: string,
  kind: "linkedin" | "blog"
): string[] {
  if (kind === "linkedin") {
    const len = text.length;
    if (len < 200 || len > 3000) {
      return [`LinkedIn length ${len} outside 200-3000`];
    }
    return [];
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words < 500) {
    return [`Blog body too short (${words} words, need >= 500)`];
  }
  return [];
}

export async function duplicateTitle(
  slug: string,
  title: string
): Promise<string[]> {
  return withDb(async () => {
    const db = requireDb();
    const reasons: string[] = [];
    const bySlug = await db.blogPost.findUnique({ where: { slug } });
    if (bySlug) {
      reasons.push(`Slug already exists: ${slug}`);
    }
    const titleNorm = title.trim().toLowerCase();
    if (titleNorm) {
      const posts = await db.blogPost.findMany({
        select: { title: true, slug: true },
      });
      const hit = posts.find(
        (p) =>
          p.slug !== slug && p.title.trim().toLowerCase() === titleNorm
      );
      if (hit) {
        reasons.push(`Duplicate title: ${title}`);
      }
    }
    return reasons;
  }, []);
}

export async function duplicateTopic(topic: string): Promise<string[]> {
  return withDb(async () => {
    const db = requireDb();
    const norm = topic.trim().toLowerCase();
    if (!norm) return [];

    const used = await db.brief.findFirst({
      where: {
        status: "used",
        topic: { equals: topic, mode: "insensitive" },
      },
    });
    if (used) {
      return [`Topic already used in a prior brief: ${topic}`];
    }

    const posts = await db.blogPost.findMany({ select: { title: true } });
    const titleHit = posts.find((p) =>
      p.title.toLowerCase().includes(norm)
    );
    if (titleHit) {
      return [`Topic appears in an existing post title: ${titleHit.title}`];
    }
    return [];
  }, []);
}

const LINK_RE = /https?:\/\/[^\s)\]>"']+/gi;

export function extractUrls(...texts: string[]): string[] {
  const set = new Set<string>();
  for (const text of texts) {
    const matches = text.match(LINK_RE) ?? [];
    for (const raw of matches) {
      const cleaned = raw.replace(/[.,;:!?)]+$/, "");
      if (cleaned) set.add(cleaned);
    }
  }
  return [...set];
}

async function headOk(url: string, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    if (res.ok || (res.status >= 300 && res.status < 400)) return true;
    // Some CDNs reject HEAD; try GET lightly
    const getRes = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { Range: "bytes=0-0" },
    });
    return getRes.ok || (getRes.status >= 300 && getRes.status < 400);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function deadLinkCheck(
  urls: string[],
  opts?: { concurrency?: number; timeoutMs?: number }
): Promise<string[]> {
  const concurrency = opts?.concurrency ?? 4;
  const timeoutMs = opts?.timeoutMs ?? 8000;
  const unique = [...new Set(urls)].filter(Boolean);
  const reasons: string[] = [];
  let i = 0;

  async function worker() {
    while (i < unique.length) {
      const idx = i++;
      const url = unique[idx];
      const ok = await headOk(url, timeoutMs);
      if (!ok) reasons.push(`Dead or unreachable link: ${url}`);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, unique.length) }, () =>
      worker()
    )
  );
  return reasons;
}

export function sourcesRequired(
  draft: Pick<BlogDraft, "sources">,
  brief: Pick<Brief, "requiresLiveSource">
): string[] {
  if (!brief.requiresLiveSource) return [];
  if (!draft.sources?.length) {
    return ["requiresLiveSource brief needs at least one source URL"];
  }
  return [];
}

export async function validateBlog(
  draft: BlogDraft,
  brief: Pick<Brief, "requiresLiveSource" | "topic">
): Promise<ValidationResult> {
  const combined = [
    draft.title,
    draft.excerpt,
    draft.body,
    draft.coverAlt,
    ...draft.tags,
    ...draft.faqs.flatMap((f) => [f.question, f.answer]),
  ].join("\n");

  const reasons: string[] = [
    ...bannedPhrases(combined),
    ...dashCheck(combined),
    ...lengthCheck(draft.body, "blog"),
    ...sourcesRequired(draft, brief),
    ...(await duplicateTitle(draft.slug, draft.title)),
    ...(await duplicateTopic(brief.topic)),
  ];

  const urls = extractUrls(draft.body, ...(draft.sources ?? []));
  reasons.push(...(await deadLinkCheck(urls)));

  return { ok: reasons.length === 0, reasons };
}

export async function validateLinkedIn(text: string): Promise<ValidationResult> {
  const reasons: string[] = [
    ...bannedPhrases(text),
    ...dashCheck(text),
    ...hashtagCheck(text),
    ...lengthCheck(text, "linkedin"),
  ];
  return { ok: reasons.length === 0, reasons };
}
