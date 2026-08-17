import type { Metadata } from "next";
import { PortfolioPageClient } from "@/components/pages/portfolio-page-client";

export const metadata: Metadata = {
  metadataBase: new URL("https://twixrsolutions.com"),
  title: "Portfolio | Twixr Solutions — Full Stack Developer",
  description:
    "Selected SaaS, AI automation, e-commerce, and cloud projects by Twixr Solutions. Top Rated Plus full-stack engineer with 50+ delivered products.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://twixrsolutions.com/portfolio",
    siteName: "Twixr Solutions Portfolio",
    title: "Portfolio | Twixr Solutions — Full Stack Developer",
    description:
      "Selected SaaS, AI automation, e-commerce, and cloud projects by Twixr Solutions. Top Rated Plus full-stack engineer with 50+ delivered products.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Twixr Solutions | Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio | Twixr Solutions — Full Stack Developer",
    description:
      "Selected SaaS, AI automation, e-commerce, and cloud projects by Twixr Solutions.",
    images: ["/og-image.png"],
    creator: "@aliraza",
  },
};

export default function PortfolioPage() {
  return <PortfolioPageClient />;
}
