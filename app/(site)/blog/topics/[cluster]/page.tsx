import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getBlogListings } from "@/lib/cms/blog";
import {
  absoluteUrl,
  breadcrumbNode,
  jsonLdGraph,
  pageMetadata,
  slugifyCluster,
} from "@/lib/seo";

type PageProps = { params: Promise<{ cluster: string }> };

/**
 * Cluster hub pages.
 *
 * Every post already stores a contentCluster and the internal-link planner
 * already scores links within it, but there was nowhere for a cluster to live.
 * Hub-and-spoke is the structure search engines use to decide a site is
 * authoritative on a subject rather than a pile of unrelated posts, and each
 * article's isPartOf now points back here.
 */
async function clusterData(slug: string) {
  const posts = await getBlogListings();
  const matching = posts.filter(
    (p) => p.contentCluster && slugifyCluster(p.contentCluster) === slug
  );
  if (!matching.length) return null;
  // Use the most common spelling as the display name.
  const names = new Map<string, number>();
  for (const p of matching) {
    const name = p.contentCluster!.trim();
    names.set(name, (names.get(name) ?? 0) + 1);
  }
  const label = [...names.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return { label, posts: matching };
}

export async function generateStaticParams() {
  const posts = await getBlogListings();
  const clusters = [
    ...new Set(
      posts
        .map((p) => p.contentCluster?.trim())
        .filter((c): c is string => Boolean(c))
        .map(slugifyCluster)
    ),
  ];
  return clusters.map((cluster) => ({ cluster }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { cluster } = await params;
  const data = await clusterData(cluster);
  if (!data) return { title: "Topic not found" };

  return pageMetadata({
    title: data.label,
    description: `Every Twixr Solutions write-up on ${data.label}: ${data.posts.length} article${data.posts.length === 1 ? "" : "s"} on what works in production, what breaks, and what it costs.`,
    path: `/blog/topics/${cluster}`,
  });
}

export default async function ClusterHubPage({ params }: PageProps) {
  const { cluster } = await params;
  const data = await clusterData(cluster);
  if (!data) notFound();

  const url = absoluteUrl(`/blog/topics/${cluster}`);

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          {
            "@type": "CollectionPage",
            name: data.label,
            url,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: data.posts.length,
              itemListElement: data.posts.map((post, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: post.title,
                url: absoluteUrl(`/blog/${post.slug}`),
              })),
            },
          },
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: data.label, path: `/blog/topics/${cluster}` },
          ]),
        ])}
      />
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <Link
          href="/blog"
          className="font-mono text-xs uppercase tracking-[0.14em] text-muted hover:text-pine"
        >
          Back to blog
        </Link>
        <h1 className="mt-6 font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
          {data.label}
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          Everything written here on {data.label}, newest first. These are
          build notes from real client work: what shipped, what broke, and what
          it cost to fix.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {data.posts.map((post) => (
            <Card key={post.slug} variant="base" className="p-5">
              <Chip>{post.category}</Chip>
              <Link href={`/blog/${post.slug}`} className="mt-3 block">
                <h2 className="font-sora text-lg font-semibold leading-snug text-ink hover:text-pine">
                  {post.title}
                </h2>
              </Link>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {post.excerpt}
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                {post.date}
                <span aria-hidden> · </span>
                {post.readingTime}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
