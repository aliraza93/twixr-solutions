import type { Metadata } from "next";
import { SchedulePageClient } from "@/components/pages/schedule-page-client";

export const metadata: Metadata = {
  metadataBase: new URL("https://twixrsolutions.com"),
  title: "Schedule a Call | Ali Raza — Full Stack Developer",
  description:
    "Book a 30-minute technical consultation with Ali Raza. Discuss your SaaS, web app, or AI automation project with a Top Rated Plus developer.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://twixrsolutions.com/schedule",
    siteName: "Ali Raza Portfolio",
    title: "Schedule a Call | Ali Raza — Full Stack Developer",
    description:
      "Book a 30-minute technical consultation to discuss your web or mobile development project.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Ali Raza | Schedule a Call" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Schedule a Call | Ali Raza — Full Stack Developer",
    description: "Book a 30-minute technical consultation with Ali Raza.",
    images: ["/og-image.png"],
    creator: "@aliraza",
  },
};

export default function SchedulePage() {
  return <SchedulePageClient />;
}
