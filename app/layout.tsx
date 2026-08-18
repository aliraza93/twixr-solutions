import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SiteEffects } from "@/components/motion/site-effects";
import { site } from "@/content/site";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG,
  TWITTER_HANDLE,
  absoluteUrl,
  siteJsonLd,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_DESCRIPTION = `${site.role} with ${site.yearsExperience} years of experience in Laravel, Node, Next.js, Vue, and AWS. Top Rated Plus on Upwork — building SaaS, e-commerce, and APIs that scale.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${site.role}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Twixr Solutions",
    "Laravel developer",
    "Next.js developer",
    "full-stack engineer",
    "Node.js developer",
    "Vue developer",
    "DevOps engineer",
    "SaaS development",
    "AWS cloud",
    "e-commerce development",
    "senior software engineer",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: site.name, url: absoluteUrl("/about") }],
  creator: site.name,
  publisher: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${site.role}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${site.role}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${site.role}`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG],
    creator: TWITTER_HANDLE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0F5132",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-canvas font-sans text-ink antialiased",
          inter.variable,
          sora.variable,
          jetbrainsMono.variable
        )}
      >
        <SmoothScroll>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <SiteEffects />
          </div>
        </SmoothScroll>
        <JsonLd data={siteJsonLd()} />
      </body>
    </html>
  );
}
