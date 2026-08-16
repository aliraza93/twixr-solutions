import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

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
  metadataBase: new URL("https://twixrsolutions.com"),
  title: "Ali Raza | Senior Full Stack Laravel & DevOps Engineer | Twixr Solutions",
  description: "Senior Full Stack Engineer with 7+ years of experience in Laravel, Next.js, and Cloud Infrastructure. Top Rated Plus on Upwork. Building scalable SaaS projects and AI automation.",
  keywords: ["Ali Raza", "Twixr Solutions", "Laravel Expert", "Next.js Developer", "Full Stack Engineer", "DevOps Engineer", "PHP Developer", "SaaS Development", "AI Automation", "Senior Software Engineer"],
  authors: [{ name: "Ali Raza" }],
  creator: "Ali Raza",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://twixrsolutions.com",
    siteName: "Ali Raza Portfolio",
    title: "Ali Raza | Senior Full Stack Laravel & DevOps Engineer",
    description: "Expert web development and scalable infrastructure solutions by Ali Raza.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ali Raza | Senior Full Stack Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ali Raza | Senior Full Stack Laravel & DevOps Engineer",
    description: "Building high-performance SaaS & Web Apps with 7+ years of expertise.",
    images: ["/og-image.png"],
    creator: "@aliraza",
  },
  robots: {
    index: true,
    follow: true,
  },
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
          </div>
        </SmoothScroll>
      </body>
    </html>
  );
}
