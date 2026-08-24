import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogDetailClient } from "@/components/pages/blog-detail-client";
import { getBlogBySlug, getBlogSlugs, getRelatedPosts } from "@/lib/cms/blog";
import { JsonLd } from "@/components/seo/json-ld";
import {
  pageMetadata,
  jsonLdGraph,
  articleNode,
  breadcrumbNode,
  faqPageNode,
} from "@/lib/seo";
import { resolvePostFaqs } from "@/content/blog-schema";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return (await getBlogSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    type: "article",
    image: post.image,
    publishedTime: post.date,
    modifiedTime: post.updatedAt ?? post.date,
    authors: [post.author],
    tags: [...post.tags],
  });
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);

  if (!post) {
    notFound();
  }

  const related = await getRelatedPosts(slug, 3);
  const faqs = resolvePostFaqs(post.body ?? "", post.faqs);

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          articleNode({
            ...post,
            tags: post.tags,
            updatedAt: post.updatedAt,
          }),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          ...(faqs.length ? [faqPageNode(faqs)] : []),
        ])}
      />
      <BlogDetailClient post={post} related={related} />
    </>
  );
}
