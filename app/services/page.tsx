import type { Metadata } from "next";
import { ServicesPageClient } from "@/components/pages/services-page-client";
import { getServiceListings } from "@/lib/data/services";

export const metadata: Metadata = {
  metadataBase: new URL("https://twixrsolutions.com"),
  title: "Services | Ali Raza — Full Stack Developer",
  description:
    "Expert SaaS development, Laravel APIs, Next.js frontends, mobile apps, AI automation, and cloud infrastructure. Top Rated Plus on Upwork.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://twixrsolutions.com/services",
    siteName: "Ali Raza Portfolio",
    title: "Services | Ali Raza — Full Stack Developer",
    description:
      "Expert SaaS development, Laravel APIs, Next.js frontends, mobile apps, AI automation, and cloud infrastructure. Top Rated Plus on Upwork.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ali Raza | Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Services | Ali Raza — Full Stack Developer",
    description:
      "Expert SaaS development, Laravel APIs, Next.js frontends, mobile apps, AI automation, and cloud infrastructure. Top Rated Plus on Upwork.",
    images: ["/og-image.png"],
    creator: "@aliraza",
  },
};

export default function ServicesPage() {
  return <ServicesPageClient services={getServiceListings()} />;
}
