import { requireDb, withDb } from "@/lib/cms/db";

/**
 * One-off text corrections to already generated posts, applied by the tick
 * before anything due is published. Idempotent: a patch that no longer
 * matches does nothing. Used when the admin editor cannot save a post
 * without losing markup it does not support (tables, code blocks).
 */
export type ContentPatch = {
  slug: string;
  /** Replaced in the blog body and in its not-yet-published social posts. */
  find: RegExp;
  replace: string;
};

export const CONTENT_PATCHES: ContentPatch[] = [
  {
    // GTA 6 released on 19 Nov 2026; the launch post claimed it was days away.
    slug: "gta-6-clipping-tool-build-vs-buy",
    find: /[^.\n]*\b\d+\s+days?\s+(?:before|until|to|left)[^.\n]*GTA\s*(?:6|VI)[^.\n]*\.\s*/gi,
    replace: "GTA 6 is out, and launch week is when clips are worth the most. ",
  },
];

export function applyPatch(text: string, patch: ContentPatch): string {
  return text.replace(patch.find, patch.replace);
}

export async function applyContentPatches(): Promise<number> {
  return withDb(async () => {
    const db = requireDb();
    let changed = 0;
    for (const patch of CONTENT_PATCHES) {
      const post = await db.blogPost.findUnique({
        where: { slug: patch.slug },
        select: { id: true, body: true, excerpt: true },
      });
      if (!post) continue;
      const body = applyPatch(post.body, patch);
      const excerpt = applyPatch(post.excerpt, patch);
      if (body !== post.body || excerpt !== post.excerpt) {
        await db.blogPost.update({ where: { id: post.id }, data: { body, excerpt } });
        changed++;
      }
      const socials = await db.socialPost.findMany({
        where: { blogPostId: post.id, status: { in: ["scheduled", "needs_review"] } },
        select: { id: true, body: true },
      });
      for (const s of socials) {
        const next = applyPatch(s.body, patch);
        if (next !== s.body) {
          await db.socialPost.update({ where: { id: s.id }, data: { body: next } });
          changed++;
        }
      }
    }
    return changed;
  }, 0);
}
