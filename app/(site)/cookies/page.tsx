import type { Metadata } from "next";
import { ManageCookiesButton } from "@/components/consent/cookie-banner";
import { LegalDocument } from "@/components/pages/legal-document";
import { legalPages } from "@/content/legal";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbNode, jsonLdGraph, pageMetadata } from "@/lib/seo";

const page = legalPages.cookies;

export const metadata: Metadata = pageMetadata({
  title: page.seoTitle,
  description: page.seoDescription,
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Cookie Policy", path: "/cookies" },
          ]),
        ])}
      />
      <LegalDocument
        page={page}
        action={<ManageCookiesButton variant="ghost" />}
      />
    </>
  );
}
