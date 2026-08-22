import type { Metadata } from "next";
import { LegalDocument } from "@/components/pages/legal-document";
import { legalPages } from "@/content/legal";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbNode, jsonLdGraph, pageMetadata } from "@/lib/seo";

const page = legalPages.privacy;

export const metadata: Metadata = pageMetadata({
  title: page.seoTitle,
  description: page.seoDescription,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Privacy Policy", path: "/privacy" },
          ]),
        ])}
      />
      <LegalDocument page={page} />
    </>
  );
}
