import { getBlogListings } from "@/content/blog";
import { SITE_URL, SITE_NAME, absoluteUrl } from "@/lib/seo";
import { site } from "@/content/site";

// Static at build time; regenerated on each deploy.
export const dynamic = "force-static";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(date?: string): string {
  const d = date ? new Date(date) : new Date();
  return isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export function GET(): Response {
  const posts = getBlogListings();

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      const image = post.image
        ? `\n      <enclosure url="${esc(post.image)}" type="image/jpeg" />`
        : "";
      const category = post.category
        ? `\n      <category>${esc(post.category)}</category>`
        : "";
      return `    <item>
      <title>${esc(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc822(post.date)}</pubDate>
      <description>${esc(post.excerpt ?? "")}</description>${category}${image}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)} Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>${esc(site.tagline)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
