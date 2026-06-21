import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailClient } from "@/components/pages/service-detail-client";
import { getServiceBySlug, getServiceSlugs } from "@/lib/data/services";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return { title: "Service Not Found | Ali Raza" };
  }

  const title = `${service.title} | Ali Raza — Full Stack Developer`;
  const description = service.longDescription;

  return {
    metadataBase: new URL("https://twixrsolutions.com"),
    title,
    description,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `https://twixrsolutions.com/services/${service.slug}`,
      siteName: "Ali Raza Portfolio",
      title,
      description,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: service.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
      creator: "@aliraza",
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  return <ServiceDetailClient service={service} />;
}
