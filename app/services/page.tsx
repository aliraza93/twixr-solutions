import type { Metadata } from "next";
import { ServicesPageClient } from "@/components/pages/services-page-client";
import { getServiceListings } from "@/lib/data/services";

export const metadata: Metadata = {
  metadataBase: new URL("https://twixrsolutions.com"),
  title: "Services | Twixr Solutions — Full Stack Developer",
  description:
    "Expert SaaS development, Laravel and Node APIs, Next.js and Vue frontends, cloud/DevOps on AWS, and e-commerce. Top Rated Plus on Upwork.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://twixrsolutions.com/services",
    siteName: "Twixr Solutions Portfolio",
    title: "Services | Twixr Solutions — Full Stack Developer",
    description:
      "Expert SaaS development, Laravel and Node APIs, Next.js and Vue frontends, cloud/DevOps on AWS, and e-commerce. Top Rated Plus on Upwork.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Twixr Solutions | Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Services | Twixr Solutions — Full Stack Developer",
    description:
      "Expert SaaS development, Laravel and Node APIs, Next.js and Vue frontends, cloud/DevOps on AWS, and e-commerce. Top Rated Plus on Upwork.",
    images: ["/og-image.png"],
    creator: "@aliraza",
  },
};

export default function ServicesPage() {
  return <ServicesPageClient services={getServiceListings()} />;
}
