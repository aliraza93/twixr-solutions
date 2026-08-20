import type { Metadata } from "next";
import { StatusPageClient } from "@/components/pages/status-page-client";
import { statusPages } from "@/content/status";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Page not found",
  description: statusPages.notFound.description,
  path: "/404",
  noindex: true,
});

export default function NotFound() {
  return <StatusPageClient variant="notFound" />;
}
