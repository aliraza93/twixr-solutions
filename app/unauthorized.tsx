import type { Metadata } from "next";
import { StatusPageClient } from "@/components/pages/status-page-client";
import { statusPages } from "@/content/status";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sign in required",
  description: statusPages.unauthorized.description,
  path: "/401",
  noindex: true,
});

export default function Unauthorized() {
  return <StatusPageClient variant="unauthorized" />;
}
