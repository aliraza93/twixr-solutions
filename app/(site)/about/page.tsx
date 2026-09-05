import type { Metadata } from "next";
import { AboutPageClient } from "@/components/pages/about-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata, jsonLdGraph, breadcrumbNode } from "@/lib/seo";
import { site } from "@/content/site";
import { getFeaturedProjects } from "@/lib/cms/portfolio";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: `${site.name} - ${site.role} and founder of Twixr Solutions. Top Rated Plus on Upwork with ${site.yearsExperience} years building SaaS, e-commerce, APIs, and cloud infrastructure with Laravel, Node, Next.js & Vue.`,
  path: "/about",
  type: "profile",
});

export default async function AboutPage() {
  const featured = await getFeaturedProjects();
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ])}
      />
      <AboutPageClient featured={featured} />
    </>
  );
}
