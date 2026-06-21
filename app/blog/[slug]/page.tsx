import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogDetailClient } from "@/components/pages/blog-detail-client";
import { getBlogBySlug, getBlogSlugs, getRelatedPosts } from "@/lib/data/blog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogBySlug(slug);

  if (!post) {
    return { title: "Post Not Found | Ali Raza" };
  }

  const title = `${post.title} | Ali Raza`;
  const description = post.excerpt;

  return {
    metadataBase: new URL("https://twixrsolutions.com"),
    title,
    description,
    openGraph: {
      type: "article",
      locale: "en_US",
      url: `https://twixrsolutions.com/blog/${post.slug}`,
      siteName: "Ali Raza Portfolio",
      title,
      description,
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: post.image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [post.image],
      creator: "@aliraza",
    },
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);

  if (!post) {
    notFound();
  }

  return <BlogDetailClient post={post} related={getRelatedPosts(slug, 3)} />;
}
