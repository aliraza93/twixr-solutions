import type { Metadata } from "next";
import { PortfolioPageClient } from "@/components/pages/portfolio-page-client";

export const metadata: Metadata = {
  metadataBase: new URL("https://twixrsolutions.com"),
  title: "Portfolio | Ali Raza — Full Stack Developer",
  description:
    "Selected SaaS, AI automation, e-commerce, and cloud projects by Ali Raza. Top Rated Plus full-stack engineer with 50+ delivered products.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://twixrsolutions.com/portfolio",
    siteName: "Ali Raza Portfolio",
    title: "Portfolio | Ali Raza — Full Stack Developer",
    description:
      "Selected SaaS, AI automation, e-commerce, and cloud projects by Ali Raza. Top Rated Plus full-stack engineer with 50+ delivered products.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ali Raza | Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio | Ali Raza — Full Stack Developer",
    description:
      "Selected SaaS, AI automation, e-commerce, and cloud projects by Ali Raza.",
    images: ["/og-image.png"],
    creator: "@aliraza",
  },
};

export default function PortfolioPage() {
  return <PortfolioPageClient />;
}
