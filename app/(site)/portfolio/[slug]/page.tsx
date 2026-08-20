import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioDetailClient } from "@/components/pages/portfolio-detail-client";
import {
  getPortfolioBySlug,
  getPortfolioSlugs,
  getRelatedProjects,
} from "@/lib/cms/portfolio";
import { JsonLd } from "@/components/seo/json-ld";
import {
  pageMetadata,
  jsonLdGraph,
  breadcrumbNode,
  absoluteUrl,
} from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return (await getPortfolioSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPortfolioBySlug(slug);

  if (!project) {
    return { title: "Case Study Not Found" };
  }

  return pageMetadata({
    title: `${project.title} — Case Study`,
    description: project.longDescription,
    path: `/portfolio/${project.slug}`,
    type: "article",
    image: project.image,
  });
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getPortfolioBySlug(slug);

  if (!project) {
    notFound();
  }

  const related = await getRelatedProjects(slug, 3);

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          {
            "@type": "CreativeWork",
            name: project.title,
            description: project.longDescription,
            url: absoluteUrl(`/portfolio/${project.slug}`),
            image: project.image?.startsWith("http")
              ? project.image
              : absoluteUrl(project.image),
            creator: { "@id": `${absoluteUrl("/")}#person` },
          },
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Portfolio", path: "/portfolio" },
            { name: project.title, path: `/portfolio/${project.slug}` },
          ]),
        ])}
      />
      <PortfolioDetailClient project={project} related={related} />
    </>
  );
}
