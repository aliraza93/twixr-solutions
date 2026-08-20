import type { Metadata } from "next";
import { SchedulePageClient } from "@/components/pages/schedule-page-client";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Schedule a Call",
  description:
    "Book a 30-minute technical consultation to discuss your SaaS, web app, or API project with a Top Rated Plus engineer.",
  path: "/schedule",
});

export default function SchedulePage() {
  return <SchedulePageClient />;
}
