import { requireDb, withDb } from "@/lib/cms/db";

/** Published blog bodies for content-graph / link audits. */
export async function getPublishedBlogBodies(): Promise<
  Array<{ slug: string; body: string; contentCluster: string; tags: string[] }>
> {
  return withDb(async () => {
    const db = requireDb();
    const rows = await db.blogPost.findMany({
      where: { published: true },
      select: {
        slug: true,
        body: true,
        contentCluster: true,
        tags: true,
      },
    });
    return rows.map((r) => ({
      slug: r.slug,
      body: r.body,
      contentCluster: r.contentCluster || "",
      tags: r.tags,
    }));
  }, []);
}
