import type { BlogDraft } from "@/lib/pipeline/generate-blog";

const STUFF_WORDS =
  /\b(best|top|cheap|hire|freelancer|developer|agency|seo|laravel developer|next\.js developer)\b/gi;

/** Clean alt text: descriptive, no stuffing, no brand spam. */
export function sanitizeImageAlt(alt: string, fallback: string): string {
  let out = (alt || "").trim() || fallback.trim();
  out = out.replace(/\s+/g, " ");
  // Drop repeated brand spam
  out = out.replace(/(twixr\s*solutions\s*)+/gi, "").trim();
  // Cap length
  if (out.length > 120) {
    out = out.slice(0, 117).replace(/\s+\S*$/, "").trim() + "...";
  }
  if (!out) out = fallback.slice(0, 80) || "Technical diagram";
  return out;
}

export function altLooksStuffed(alt: string): boolean {
  const lower = alt.toLowerCase();
  const hits = lower.match(STUFF_WORDS) ?? [];
  if (hits.length >= 4) return true;
  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length >= 6) {
    const uniq = new Set(words);
    if (uniq.size / words.length < 0.5) return true;
  }
  return /laravel\s+seo\s+laravel/i.test(alt);
}

/** Descriptive Cloudinary/public filename from slug + role. */
export function seoImageFilename(
  slug: string,
  role: "cover" | "inline" | "linkedin",
  index?: number
): string {
  const clean = (slug || "post")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const suffix =
    role === "inline" ? `inline-${(index ?? 1)}` : role === "cover" ? "cover" : "social";
  return `${clean}-${suffix}-${Date.now()}.png`;
}

/** Normalize draft image alts before generation / validation. */
export function sanitizeDraftImageAlts(draft: BlogDraft): BlogDraft {
  const coverAlt = sanitizeImageAlt(
    draft.coverAlt,
    `${draft.title} cover illustration`
  );
  const inlineImagePrompts = draft.inlineImagePrompts.map((p, i) => ({
    ...p,
    alt: sanitizeImageAlt(
      p.alt,
      `${draft.title} diagram ${i + 1}`
    ),
  }));
  return { ...draft, coverAlt, inlineImagePrompts };
}

export function imageAltWarnings(draft: BlogDraft): string[] {
  const warnings: string[] = [];
  if (altLooksStuffed(draft.coverAlt)) {
    warnings.push(`Cover alt looks keyword-stuffed: "${draft.coverAlt.slice(0, 80)}"`);
  }
  for (const p of draft.inlineImagePrompts) {
    if (altLooksStuffed(p.alt)) {
      warnings.push(`Inline alt looks keyword-stuffed: "${p.alt.slice(0, 80)}"`);
    }
    if (!p.alt.trim()) {
      warnings.push(`Inline image ${p.placeholder} missing alt text`);
    }
  }
  return warnings;
}
