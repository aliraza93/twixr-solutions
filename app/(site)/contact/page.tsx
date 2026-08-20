import type { Metadata } from "next";
import { ContactPageClient } from "@/components/pages/contact-page-client";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Tell Twixr Solutions about your SaaS, e-commerce, or API project. Email, Upwork, or the contact form — replies usually within a few hours.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactPageClient />;
}
