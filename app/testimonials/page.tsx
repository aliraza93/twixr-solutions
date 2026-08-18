import type { Metadata } from "next";
import { TestimonialsPageClient } from "@/components/pages/testimonials-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata, jsonLdGraph, breadcrumbNode } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Results",
  description:
    "Real client reviews from Upwork, Fiverr, and direct engagements — Top Rated Plus with a 100% Job Success score.",
  path: "/testimonials",
});

export default function TestimonialsPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Results", path: "/testimonials" },
          ]),
        ])}
      />
      <TestimonialsPageClient />
    </>
  );
}
