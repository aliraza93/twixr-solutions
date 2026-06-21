import type { Metadata } from "next";
import {
  ServicesPageClient,
  type ServiceListingItem,
} from "@/components/pages/services-page-client";

export const metadata: Metadata = {
  metadataBase: new URL("https://twixrsolutions.com"),
  title: "Services | Ali Raza — Full Stack Developer",
  description:
    "Expert SaaS development, Laravel APIs, Next.js frontends, mobile apps, AI automation, and cloud infrastructure. Top Rated Plus on Upwork.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://twixrsolutions.com/services",
    siteName: "Ali Raza Portfolio",
    title: "Services | Ali Raza — Full Stack Developer",
    description:
      "Expert SaaS development, Laravel APIs, Next.js frontends, mobile apps, AI automation, and cloud infrastructure. Top Rated Plus on Upwork.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ali Raza | Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Services | Ali Raza — Full Stack Developer",
    description:
      "Expert SaaS development, Laravel APIs, Next.js frontends, mobile apps, AI automation, and cloud infrastructure. Top Rated Plus on Upwork.",
    images: ["/og-image.png"],
    creator: "@aliraza",
  },
};

const services: ServiceListingItem[] = [
  {
    slug: "saas-web-app-development",
    icon: "Layers",
    illustration: "/services/saas-web-app-development.svg",
    categoryId: "product",
    categoryLabel: "Web & SaaS",
    title: "SaaS & Web App Development",
    description:
      "End-to-end SaaS platforms built for scale — multi-tenancy, billing, auth, and dashboards.",
    tags: ["Next.js", "Laravel", "PostgreSQL", "Stripe"],
  },
  {
    slug: "laravel-api-backend",
    icon: "Server",
    illustration: "/services/laravel-api-backend.svg",
    categoryId: "backend",
    categoryLabel: "API & backend",
    title: "Laravel API & Backend",
    description:
      "High-performance REST and GraphQL APIs, queues, microservices, and admin panels.",
    tags: ["Laravel", "PHP", "MySQL", "Redis"],
  },
  {
    slug: "nextjs-frontend",
    icon: "Monitor",
    illustration: "/services/nextjs-frontend.svg",
    categoryId: "product",
    categoryLabel: "Frontend",
    title: "Next.js Frontend Development",
    description:
      "Fast, SEO-optimized frontends with server components, animations, and pixel-perfect UI.",
    tags: ["Next.js", "TypeScript", "Tailwind", "Framer Motion"],
  },
  {
    slug: "ai-automation-chatbots",
    icon: "Bot",
    illustration: "/services/ai-automation-chatbots.svg",
    categoryId: "ai",
    categoryLabel: "AI automation",
    title: "AI Automation & Chatbots",
    description:
      "LLM-powered chatbots, workflow automation, and AI integrations built for real business impact.",
    tags: ["OpenAI", "LangChain", "Python", "Node.js"],
  },
  {
    slug: "cloud-infrastructure-devops",
    icon: "Cloud",
    illustration: "/services/cloud-infrastructure-devops.svg",
    categoryId: "cloud",
    categoryLabel: "Cloud & DevOps",
    title: "Cloud Infrastructure & DevOps",
    description:
      "AWS/GCP setup, CI/CD pipelines, Docker, Kubernetes, and 99.99% uptime deployments.",
    tags: ["AWS", "Docker", "GitHub Actions", "Terraform"],
  },
  {
    slug: "mobile-app-development",
    icon: "Smartphone",
    illustration: "/services/mobile-app-development.svg",
    categoryId: "mobile",
    categoryLabel: "Mobile",
    title: "Mobile App Development",
    description:
      "Cross-platform iOS and Android apps with smooth UX, push notifications, and app store deployment.",
    tags: ["Flutter", "Dart", "Expo", "React Native"],
  },
];

export default function ServicesPage() {
  return <ServicesPageClient services={services} />;
}
