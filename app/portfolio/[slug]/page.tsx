import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioDetailClient } from "@/components/pages/portfolio-detail-client";
import { getPortfolioBySlug, getPortfolioSlugs, getRelatedProjects } from "@/lib/data/portfolio";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getPortfolioSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getPortfolioBySlug(slug);

  if (!project) {
    return { title: "Case Study Not Found | Ali Raza" };
  }

  const title = `${project.title} — Case Study | Ali Raza`;
  const description = project.longDescription;

  return {
    metadataBase: new URL("https://twixrsolutions.com"),
    title,
    description,
    openGraph: {
      type: "article",
      locale: "en_US",
      url: `https://twixrsolutions.com/portfolio/${project.slug}`,
      siteName: "Ali Raza Portfolio",
      title,
      description,
      images: [
        {
          url: project.image,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [project.image],
      creator: "@aliraza",
    },
  };
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getPortfolioBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <PortfolioDetailClient project={project} related={getRelatedProjects(slug, 3)} />
  );
}
