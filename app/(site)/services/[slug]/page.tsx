import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailClient } from "@/components/pages/service-detail-client";
import { getServiceBySlug, getServiceSlugs } from "@/lib/cms/services";
import { getTestimonials } from "@/lib/cms/testimonials";
import { JsonLd } from "@/components/seo/json-ld";
import {
  pageMetadata,
  jsonLdGraph,
  serviceNode,
  breadcrumbNode,
} from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return (await getServiceSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return { title: "Service Not Found" };
  }

  return pageMetadata({
    title: service.title,
    description: service.longDescription,
    path: `/services/${service.slug}`,
  });
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [service, testimonials] = await Promise.all([
    getServiceBySlug(slug),
    getTestimonials(),
  ]);

  if (!service) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          serviceNode({
            slug: service.slug,
            title: service.title,
            description: service.longDescription,
          }),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: service.title, path: `/services/${service.slug}` },
          ]),
        ])}
      />
      <ServiceDetailClient service={service} testimonials={testimonials} />
    </>
  );
}
