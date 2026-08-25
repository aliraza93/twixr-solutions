import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { site } from "@/content/site";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG,
  TWITTER_HANDLE,
  absoluteUrl,
} from "@/lib/seo";

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

const SITE_DESCRIPTION = `${site.role} with ${site.yearsExperience} years of experience in Laravel, Node, Next.js, Vue, and AWS. Top Rated Plus on Upwork - building SaaS, e-commerce, and APIs that scale.`;

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
  alternates: {
    types: {
      "application/rss+xml": [
        { url: absoluteUrl("/feed.xml"), title: `${SITE_NAME} Blog` },
      ],
    },
  },
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
        alt: `${SITE_NAME} - ${site.role}`,
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
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon-96x96.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
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
        {children}
      </body>
    </html>
  );
}
