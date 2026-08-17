import type { Metadata } from "next";
import { SchedulePageClient } from "@/components/pages/schedule-page-client";

export const metadata: Metadata = {
  metadataBase: new URL("https://twixrsolutions.com"),
  title: "Schedule a Call | Twixr Solutions — Full Stack Developer",
  description:
      "Book a 30-minute technical consultation with Twixr Solutions. Discuss your SaaS, web app, or API project with a Top Rated Plus engineer.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://twixrsolutions.com/schedule",
    siteName: "Twixr Solutions Portfolio",
    title: "Schedule a Call | Twixr Solutions — Full Stack Developer",
    description:
      "Book a 30-minute technical consultation to discuss your web or SaaS project.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Twixr Solutions | Schedule a Call" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Schedule a Call | Twixr Solutions — Full Stack Developer",
    description: "Book a 30-minute technical consultation with Twixr Solutions.",
    images: ["/og-image.png"],
    creator: "@aliraza",
  },
};

export default function SchedulePage() {
  return <SchedulePageClient />;
}
