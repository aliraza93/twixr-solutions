import type { MetadataRoute } from "next";
import { SITE_URL, slugifyCluster } from "@/lib/seo";
import { getBlogListings } from "@/lib/cms/blog";
import { getPortfolioSlugs } from "@/lib/cms/portfolio";
import { getServiceSlugs } from "@/lib/cms/services";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/services`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/portfolio`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/testimonials`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/editorial-policy`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/schedule`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cookies`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const [serviceSlugs, portfolioSlugs, posts] = await Promise.all([
    getServiceSlugs(),
    getPortfolioSlugs(),
    getBlogListings(),
  ]);

  const services: MetadataRoute.Sitemap = serviceSlugs.map((slug) => ({
    url: `${SITE_URL}/services/${slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const portfolio: MetadataRoute.Sitemap = portfolioSlugs.map((slug) => ({
    url: `${SITE_URL}/portfolio/${slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // lastModified should track the real last edit, not the publish date, so the
  // content refresh loop actually signals freshness. changeFrequency is a hint
  // only, but "yearly" on a blog that gets revisited is the wrong hint.
  const blog: MetadataRoute.Sitemap = posts.map((post) => {
    const modified = post.updatedAt
      ? new Date(post.updatedAt)
      : post.date
        ? new Date(post.date)
        : undefined;
    const ageDays = modified
      ? (Date.now() - modified.getTime()) / 86_400_000
      : Number.POSITIVE_INFINITY;
    return {
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: modified,
      changeFrequency: ageDays < 365 ? ("monthly" as const) : ("yearly" as const),
      priority: 0.6,
    };
  });

  // Cluster hubs: the spokes already link up through isPartOf, so the hubs
  // belong in the sitemap too.
  // Dedupe by slug, not by the raw string: "AI & Industry News" and
  // "AI & industry news" are one hub, and keying on the string emitted the
  // same URL twice with a duplicate title and description.
  const clusterSlugs = [
    ...new Set(
      posts
        .map((p) => p.contentCluster?.trim())
        .filter((c): c is string => Boolean(c))
        .map(slugifyCluster)
        .filter(Boolean)
    ),
  ];
  const hubs: MetadataRoute.Sitemap = clusterSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/topics/${slug}`,
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  return [...staticRoutes, ...services, ...portfolio, ...hubs, ...blog];
}
