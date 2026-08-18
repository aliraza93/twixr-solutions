import type { Metadata } from "next";
import { PortfolioPageClient } from "@/components/pages/portfolio-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata, jsonLdGraph, breadcrumbNode } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Portfolio",
  description:
    "Selected SaaS, e-commerce, API, and cloud projects — case studies from a Top Rated Plus full-stack engineer building products that scale.",
  path: "/portfolio",
});

export default function PortfolioPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Portfolio", path: "/portfolio" },
          ]),
        ])}
      />
      <PortfolioPageClient />
    </>
  );
}
