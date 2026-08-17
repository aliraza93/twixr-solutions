import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SiteEffects } from "@/components/motion/site-effects";
import { site } from "@/content/site";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://www.twixrsolutions.com"),
  title: `${site.brand} | ${site.role}`,
  description: `${site.role} with ${site.yearsExperience} years of experience in Laravel, Node, Next.js, Vue, and AWS. Top Rated Plus on Upwork. Building SaaS, e-commerce, and APIs that scale.`,
  keywords: ["Twixr Solutions", "Laravel Expert", "Next.js Developer", "Full Stack Engineer", "DevOps Engineer", "PHP Developer", "SaaS Development", "AI Automation", "Senior Software Engineer"],
  authors: [{ name: site.brand }],
  creator: site.brand,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://twixrsolutions.com",
    siteName: site.brand,
    title: `${site.brand} | ${site.role}`,
    description: "Expert web development and scalable infrastructure solutions by Twixr Solutions.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${site.brand} | Senior Full Stack Engineer`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.brand} | ${site.role}`,
    description: `Building high-performance SaaS & Web Apps with ${site.yearsExperience} years of expertise.`,
    images: ["/og-image.png"],
    creator: "@aliraza",
  },
  robots: {
    index: true,
    follow: true,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: site.brand,
                  url: "https://twixrsolutions.com",
                  email: site.contact.email,
                  sameAs: [site.contact.upwork, site.contact.fiverr, site.contact.linkedin].filter(
                    (href) => href.startsWith("http")
                  ),
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
