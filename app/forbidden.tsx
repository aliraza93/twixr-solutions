import type { Metadata } from "next";
import { StatusPageClient } from "@/components/pages/status-page-client";
import { statusPages } from "@/content/status";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Forbidden",
  description: statusPages.forbidden.description,
  path: "/403",
  noindex: true,
});

export default function Forbidden() {
  return <StatusPageClient variant="forbidden" />;
}
