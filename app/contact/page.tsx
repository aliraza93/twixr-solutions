import type { Metadata } from "next";
import { ContactPageClient } from "@/components/pages/contact-page-client";

export const metadata: Metadata = {
  metadataBase: new URL("https://twixrsolutions.com"),
  title: "Contact | Twixr Solutions — Full Stack Developer",
  description:
    "Tell Twixr Solutions about your SaaS, e-commerce, or API project. Email, Upwork, or the contact form — replies usually within a few hours.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://twixrsolutions.com/contact",
    siteName: "Twixr Solutions Portfolio",
    title: "Contact | Twixr Solutions — Full Stack Developer",
    description:
      "Tell me about the project — I usually reply within a few hours.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Twixr Solutions | Contact",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact | Twixr Solutions — Full Stack Developer",
    description: "Tell me about the project — I usually reply within a few hours.",
    images: ["/og-image.png"],
    creator: "@aliraza",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
