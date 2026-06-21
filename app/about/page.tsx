import type { Metadata } from "next";
import { AboutPageClient } from "@/components/pages/about-page-client";

export const metadata: Metadata = {
  metadataBase: new URL("https://twixrsolutions.com"),
  title: "About | Ali Raza — Full Stack Developer",
  description:
    "Learn about Ali Raza — Senior Full Stack Engineer, Founder of Twixr Solutions, Top Rated Plus on Upwork. 10+ years building SaaS, APIs, and AI automation.",
  openGraph: {
    type: "profile",
    locale: "en_US",
    url: "https://twixrsolutions.com/about",
    siteName: "Ali Raza Portfolio",
    title: "About | Ali Raza — Full Stack Developer",
    description:
      "Senior Full Stack Engineer with 10+ years of experience in Laravel, Next.js, and cloud infrastructure.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Ali Raza | About" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About | Ali Raza — Full Stack Developer",
    description: "Senior Full Stack Engineer, Founder of Twixr Solutions.",
    images: ["/og-image.png"],
    creator: "@aliraza",
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
