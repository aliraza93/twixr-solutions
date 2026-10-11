import { BANNED_PHRASES } from "@/content/pipeline/banned-phrases";
import { requireDb, withDb } from "@/lib/cms/db";
import type { BlogDraft } from "@/lib/pipeline/generate-blog";
import {
  normalizeSiteUrl,
  pathFromUrl,
  toAbsoluteInventoryUrl,
} from "@/lib/pipeline/seo/types";
import { SITE_URL } from "@/lib/seo";
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

/**
 * Hashtag count check.
 *
 * The count is drawn per post now (0 to 5), so a fixed 4-to-6 rule would fail
 * the pipeline's own output. When an expected count is supplied, allow a drift
 * of one either way; with no expectation, fall back to a permissive 0-to-6.
 */
export function hashtagCheck(text: string, expected?: number): string[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const last = lines[lines.length - 1] ?? "";
  const tags = last.match(/#[\w]+/g) ?? [];

  if (expected === undefined) {
    if (tags.length > 6) {
      return [`Too many hashtags (found ${tags.length}, max 6)`];
    }
    return [];
  }

  if (expected === 0) {
    return tags.length === 0
      ? []
      : [`Plan asked for no hashtags but found ${tags.length}`];
  }

  const min = Math.max(1, expected - 1);
  const max = Math.min(6, expected + 1);
  if (tags.length < min || tags.length > max) {
    return [
      `Hashtag count ${tags.length} outside planned ${min}-${max}: "${last.slice(0, 80)}"`,
    ];
  }
  return [];
}

/**
 * The body must not open with a markdown H1. The page title is already the
 * document's h1, so a leading "# Title" renders a duplicate. The prompt asks
 * for ## and ###; this enforces it rather than trusting it.
 */
export function headingLevelCheck(body: string): string[] {
  const first = body.split("\n").find((l) => l.trim());
  if (first && /^#\s+\S/.test(first.trim())) {
    return [`Body opens with a markdown H1: "${first.trim().slice(0, 60)}"`];
  }
  const h1s = body
    .split("\n")
    .filter((l) => /^#\s+\S/.test(l.trim())).length;
  if (h1s > 0) {
    return [`Body contains ${h1s} markdown H1 heading(s); use ## and ###`];
  }
  return [];
}

/** Titles over ~60 characters truncate in the SERP. */
export function titleLengthCheck(title: string): string[] {
  const n = title.trim().length;
  if (n > 60) {
    return [`Title is ${n} chars; it will truncate in search results (max 60)`];
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
  // The length band is drawn per post and the shortest band starts at ~420
  // words, so the hard floor sits below it. Depth fit is a soft warning.
  if (words < 380) {
    return [`Blog body too short (${words} words, need >= 380)`];
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
const MD_LINK_RE = /\[[^\]]*\]\(([^)\s]+)\)/g;

export function extractUrls(...texts: string[]): string[] {
  const set = new Set<string>();
  for (const text of texts) {
    const matches = text.match(LINK_RE) ?? [];
    for (const raw of matches) {
      const cleaned = raw.replace(/[.,;:!?)]+$/, "");
      if (cleaned) set.add(cleaned);
    }
    MD_LINK_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = MD_LINK_RE.exec(text))) {
      const href = (m[1] || "").trim();
      if (/^https?:\/\//i.test(href)) {
        set.add(href.replace(/[.,;:!?)]+$/, ""));
      } else if (href.startsWith("/") && !href.startsWith("//")) {
        set.add(href.split("#")[0] || href);
      }
    }
  }
  return [...set];
}

/** Flag site-absolute or root-relative links that are not in the allowlist. */
export function unknownInternalLinks(
  draftBody: string,
  allowlist: Set<string>
): string[] {
  if (!allowlist.size) return [];

  const reasons: string[] = [];
  const urls = extractUrls(draftBody);
  const siteHost = new URL(SITE_URL).hostname.replace(/^www\./, "");

  for (const raw of urls) {
    let absolute: string;
    try {
      absolute = toAbsoluteInventoryUrl(raw);
    } catch {
      continue;
    }
    let host = "";
    try {
      host = new URL(absolute).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }
    if (host !== siteHost) continue; // external OK (sources)

    const normalized = normalizeSiteUrl(absolute);
    const path = pathFromUrl(normalized);
    const pathAbs = toAbsoluteInventoryUrl(path);
    if (!allowlist.has(normalized) && !allowlist.has(pathAbs)) {
      reasons.push(`Invented or disallowed internal link: ${raw}`);
    }
  }
  return reasons;
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
  brief: Pick<Brief, "requiresLiveSource" | "topic">,
  opts?: { internalAllowlist?: Set<string> }
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
    ...headingLevelCheck(draft.body),
    ...titleLengthCheck(draft.title),
    ...sourcesRequired(draft, brief),
    ...(await duplicateTitle(draft.slug, draft.title)),
    ...(await duplicateTopic(brief.topic)),
  ];

  if (opts?.internalAllowlist?.size) {
    reasons.push(...unknownInternalLinks(draft.body, opts.internalAllowlist));
  }

  const urls = extractUrls(draft.body, ...(draft.sources ?? []));
  // Dead-link check only for external http(s) URLs (skip internal allowlisted)
  const external = urls.filter((u) => {
    if (!/^https?:\/\//i.test(u) && u.startsWith("/")) return false;
    try {
      const host = new URL(toAbsoluteInventoryUrl(u)).hostname.replace(
        /^www\./,
        ""
      );
      const siteHost = new URL(SITE_URL).hostname.replace(/^www\./, "");
      return host !== siteHost;
    } catch {
      return true;
    }
  });
  reasons.push(...(await deadLinkCheck(external)));

  return { ok: reasons.length === 0, reasons };
}

export async function validateLinkedIn(
  text: string,
  opts?: { expectedHashtags?: number }
): Promise<ValidationResult> {
  const reasons: string[] = [
    ...bannedPhrases(text),
    ...dashCheck(text),
    ...hashtagCheck(text, opts?.expectedHashtags),
    ...lengthCheck(text, "linkedin"),
  ];
  return { ok: reasons.length === 0, reasons };
}
