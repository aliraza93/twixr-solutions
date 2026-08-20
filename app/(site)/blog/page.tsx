import type { Metadata } from "next";
import { BlogPageClient } from "@/components/pages/blog-page-client";
import { getBlogCategories, getBlogListings } from "@/lib/cms/blog";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  description:
    "Insights on software engineering, SaaS architecture, Laravel, Next.js, remote work, and building products that scale.",
  path: "/blog",
});

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([
    getBlogListings(),
    getBlogCategories(),
  ]);

  return (
    <BlogPageClient
      posts={posts}
      categories={categories}
    />
  );
}
