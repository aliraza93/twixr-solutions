import type { Metadata } from "next";
import { TestimonialsPageClient } from "@/components/pages/testimonials-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata, jsonLdGraph, breadcrumbNode } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Results",
  description:
    "Real, verified client reviews from Upwork — Top Rated Plus with a 100% Job Success score and a 4.7-star rating across 40 reviews.",
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
