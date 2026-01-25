import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

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
        url: "/og-image.png", // Assuming an OG image exists or will be added
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
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          outfit.variable
        )}
      >
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
