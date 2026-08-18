import type { Metadata } from "next";
import { BlogPageClient } from "@/components/pages/blog-page-client";
import { getBlogCategories, getBlogListings } from "@/content/blog";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  description:
    "Insights on software engineering, SaaS architecture, Laravel, Next.js, remote work, and building products that scale.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <BlogPageClient
      posts={getBlogListings()}
      categories={getBlogCategories()}
    />
  );
}
