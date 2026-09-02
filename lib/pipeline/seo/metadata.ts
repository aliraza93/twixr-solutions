import type { BlogDraft } from "@/lib/pipeline/generate-blog";

export type MetadataCheck = {
  ok: boolean;
  hardFails: string[];
  warnings: string[];
};

/**
 * Soft + hard SEO metadata checks for pipeline drafts.
 * Hard fails: empty title/slug/excerpt, slug with unsafe chars.
 * Warnings: length outside ideal ranges, keyword stuffing signals.
 */
export function assessBlogMetadata(draft: BlogDraft): MetadataCheck {
  const hardFails: string[] = [];
  const warnings: string[] = [];

  const title = draft.title.trim();
  const excerpt = draft.excerpt.trim();
  const slug = draft.slug.trim();

  if (!title) hardFails.push("Title is empty");
  if (!excerpt) hardFails.push("Excerpt (meta description) is empty");
  if (!slug) hardFails.push("Slug is empty");
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    hardFails.push(`Slug is not clean kebab-case: ${slug}`);
  }
  if (slug.length > 80) hardFails.push(`Slug too long (${slug.length} > 80)`);

  if (title.length > 0 && title.length < 30) {
    warnings.push(`Title short for SEO (${title.length} chars; aim 30-65)`);
  }
  if (title.length > 65) {
    warnings.push(`Title long for SERP (${title.length} chars; aim <= 65)`);
  }
  if (excerpt.length > 0 && excerpt.length < 70) {
    warnings.push(
      `Excerpt short (${excerpt.length} chars; aim 120-160 for meta description)`
    );
  }
  if (excerpt.length > 160) {
    warnings.push(`Excerpt over 160 chars (${excerpt.length})`);
  }

  const keyword = (draft.primaryKeyword || "").trim().toLowerCase();
  if (keyword && title && !title.toLowerCase().includes(keyword.split(" ")[0] || keyword)) {
    warnings.push("Title may not reflect primary keyword");
  }

  // Crude stuffing: same 4+ word phrase repeated in title+excerpt
  const blob = `${title} ${excerpt}`.toLowerCase();
  const words = blob.split(/\s+/).filter(Boolean);
  if (words.length >= 8) {
    const grams = new Map<string, number>();
    for (let i = 0; i < words.length - 3; i++) {
      const g = words.slice(i, i + 4).join(" ");
      grams.set(g, (grams.get(g) || 0) + 1);
    }
    for (const [g, n] of grams) {
      if (n >= 3) {
        warnings.push(`Possible keyword stuffing phrase: "${g}"`);
        break;
      }
    }
  }

  return {
    ok: hardFails.length === 0,
    hardFails,
    warnings,
  };
}
