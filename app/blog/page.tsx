import type { Metadata } from "next";
import { BlogPageClient } from "@/components/pages/blog-page-client";

export const metadata: Metadata = {
  metadataBase: new URL("https://twixrsolutions.com"),
  title: "Blog | Ali Raza — Full Stack Developer",
  description:
    "Insights on software engineering, SaaS architecture, Laravel, Next.js, remote work, and building products that scale.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://twixrsolutions.com/blog",
    siteName: "Ali Raza Portfolio",
    title: "Blog | Ali Raza — Full Stack Developer",
    description:
      "Insights on software engineering, SaaS architecture, Laravel, Next.js, remote work, and building products that scale.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Ali Raza | Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Ali Raza — Full Stack Developer",
    description: "Insights on software engineering, SaaS, and remote work.",
    images: ["/og-image.png"],
    creator: "@aliraza",
  },
};

export default function BlogPage() {
  return <BlogPageClient />;
}
