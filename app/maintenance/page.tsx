import type { Metadata } from "next";
import { StatusPageClient } from "@/components/pages/status-page-client";
import { statusPages } from "@/content/status";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Maintenance",
  description: statusPages.maintenance.description,
  path: "/maintenance",
  noindex: true,
});

export default function MaintenancePage() {
  return <StatusPageClient variant="maintenance" />;
}
