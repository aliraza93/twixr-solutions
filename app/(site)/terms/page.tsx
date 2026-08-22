import type { Metadata } from "next";
import { LegalDocument } from "@/components/pages/legal-document";
import { legalPages } from "@/content/legal";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbNode, jsonLdGraph, pageMetadata } from "@/lib/seo";

const page = legalPages.terms;

export const metadata: Metadata = pageMetadata({
  title: page.seoTitle,
  description: page.seoDescription,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Terms of Service", path: "/terms" },
          ]),
        ])}
      />
      <LegalDocument page={page} />
    </>
  );
}
