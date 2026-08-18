import type { Metadata } from "next";
import { ServicesPageClient } from "@/components/pages/services-page-client";
import { getServiceListings } from "@/lib/data/services";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata, jsonLdGraph, breadcrumbNode } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Services",
  description:
    "SaaS development, Laravel & Node APIs, Next.js & Vue frontends, cloud/DevOps on AWS, e-commerce, and AI automation — by a Top Rated Plus full-stack engineer.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
        ])}
      />
      <ServicesPageClient services={getServiceListings()} />
    </>
  );
}
