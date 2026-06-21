export type ServiceCatalogCategoryId =
  | "product"
  | "backend"
  | "ai"
  | "cloud"
  | "mobile";

export type ServiceIconName =
  | "Layers"
  | "Server"
  | "Monitor"
  | "Bot"
  | "Cloud"
  | "Smartphone";

export type ServiceListingItem = {
  slug: string;
  icon: ServiceIconName;
  illustration: string;
  categoryId: ServiceCatalogCategoryId;
  categoryLabel: string;
  title: string;
  description: string;
  tags: readonly string[];
};

export type ServicePackage = {
  id: string;
  name: string;
  subtitle: string;
  delivery: string;
  revisions: string;
  features: string[];
  popular?: boolean;
};

export type ServiceFaq = {
  question: string;
  answer: string;
};

export type ServiceDetail = ServiceListingItem & {
  longDescription: string;
  gallery: string[];
  included: string[];
  sidebarHighlights: string[];
  packages: ServicePackage[];
  faqs: ServiceFaq[];
};

const sharedPackages = {
  starter: (features: string[]): ServicePackage => ({
    id: "starter",
    name: "Starter",
    subtitle: "Focused MVP scope",
    delivery: "4–6 weeks",
    revisions: "2 rounds",
    features,
  }),
  growth: (features: string[], popular = true): ServicePackage => ({
    id: "growth",
    name: "Growth",
    subtitle: "Production-ready build",
    delivery: "8–12 weeks",
    revisions: "4 rounds",
    features,
    popular,
  }),
  enterprise: (features: string[]): ServicePackage => ({
    id: "enterprise",
    name: "Enterprise",
    subtitle: "Scale & ongoing partnership",
    delivery: "Custom timeline",
    revisions: "Unlimited within sprint",
    features,
  }),
};

export const services: ServiceDetail[] = [
  {
    slug: "saas-web-app-development",
    icon: "Layers",
    illustration: "/services/saas-web-app-development.svg",
    categoryId: "product",
    categoryLabel: "Web & SaaS",
    title: "SaaS & Web App Development",
    description:
      "End-to-end SaaS platforms built for scale — multi-tenancy, billing, auth, and dashboards.",
    longDescription:
      "I design and ship full-stack SaaS products from architecture through launch — multi-tenant data models, subscription billing, role-based access, admin dashboards, and analytics that scale with your business.",
    tags: ["Next.js", "Laravel", "PostgreSQL", "Stripe"],
    gallery: [
      "/services/saas-web-app-development.svg",
      "/services/saas-web-app-development.svg",
    ],
    included: [
      "Product discovery & technical architecture",
      "Multi-tenant database design",
      "Auth, roles & permissions",
      "Stripe billing & subscription flows",
      "Admin dashboard & user portal",
      "REST/GraphQL API layer",
      "CI/CD & staging environment",
      "Documentation & handoff",
    ],
    sidebarHighlights: [
      "Architecture review",
      "Weekly progress updates",
      "Source code ownership",
      "Post-launch support window",
    ],
    packages: [
      sharedPackages.starter([
        "Core MVP features",
        "Auth & basic billing",
        "Responsive web app",
        "Deployment setup",
      ]),
      sharedPackages.growth([
        "Multi-tenancy",
        "Advanced billing tiers",
        "Admin analytics",
        "Email notifications",
        "API documentation",
      ]),
      sharedPackages.enterprise([
        "Dedicated sprint cadence",
        "Performance optimization",
        "Security audit support",
        "Team onboarding & training",
      ]),
    ],
    faqs: [
      {
        question: "Do you build both the frontend and backend?",
        answer:
          "Yes. I deliver end-to-end SaaS builds — Next.js frontends with Laravel or Node APIs, PostgreSQL, and Stripe integrations in one cohesive codebase.",
      },
      {
        question: "Can you work with an existing codebase?",
        answer:
          "Absolutely. I regularly audit, refactor, and extend existing SaaS products — adding billing, tenancy, or new feature modules without disrupting live users.",
      },
      {
        question: "How do you handle multi-tenancy?",
        answer:
          "I implement tenant isolation at the database and application layer — subdomain or account-based routing, scoped queries, and per-tenant configuration as your product requires.",
      },
      {
        question: "What does scope-based pricing mean?",
        answer:
          "Each tier reflects a defined scope and timeline. After a discovery call, I provide a clear proposal aligned to your MVP or growth goals — no hidden fees.",
      },
    ],
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
    longDescription:
      "Production-grade Laravel backends with clean architecture — REST and GraphQL APIs, queue workers, event-driven workflows, admin panels, and integrations built for reliability and scale.",
    tags: ["Laravel", "PHP", "MySQL", "Redis"],
    gallery: [
      "/services/laravel-api-backend.svg",
      "/services/laravel-api-backend.svg",
    ],
    included: [
      "API design & OpenAPI documentation",
      "Authentication & authorization",
      "Database migrations & seeders",
      "Queue & job processing",
      "Caching with Redis",
      "Unit & feature tests",
      "Admin panel (Filament/Nova)",
      "Deployment & monitoring hooks",
    ],
    sidebarHighlights: [
      "Laravel best practices",
      "Test coverage on critical paths",
      "Performance profiling",
      "Knowledge transfer session",
    ],
    packages: [
      sharedPackages.starter([
        "REST API core endpoints",
        "Auth (Sanctum/Passport)",
        "MySQL schema design",
        "Basic admin CRUD",
      ]),
      sharedPackages.growth([
        "GraphQL or advanced REST",
        "Queue workers & jobs",
        "Redis caching layer",
        "Automated test suite",
        "API versioning",
      ]),
      sharedPackages.enterprise([
        "Microservice extraction",
        "Load testing & optimization",
        "Observability (logs, alerts)",
        "Ongoing maintenance retainer",
      ]),
    ],
    faqs: [
      {
        question: "REST or GraphQL — which do you recommend?",
        answer:
          "REST suits most B2B and mobile clients. GraphQL is ideal when clients need flexible queries. I advise based on your frontend and third-party integration needs.",
      },
      {
        question: "Do you use Laravel Octane or Horizon?",
        answer:
          "Yes, when performance demands it. Horizon for queue monitoring, Octane for high-throughput APIs, and standard queues for most MVPs.",
      },
      {
        question: "Can you integrate with our existing frontend?",
        answer:
          "Yes. I deliver documented APIs that any React, Next.js, or mobile client can consume, with CORS, rate limiting, and token auth configured.",
      },
    ],
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
    longDescription:
      "High-performance Next.js applications with App Router, server components, and polished UI — built for SEO, accessibility, and conversion, with motion and design systems that match your brand.",
    tags: ["Next.js", "TypeScript", "Tailwind", "Framer Motion"],
    gallery: ["/services/nextjs-frontend.svg", "/services/nextjs-frontend.svg"],
    included: [
      "Responsive UI implementation",
      "Server & client components",
      "SEO metadata & Open Graph",
      "Performance optimization (Core Web Vitals)",
      "Accessible components (WCAG-aware)",
      "Animation & micro-interactions",
      "API integration layer",
      "Vercel or custom deployment",
    ],
    sidebarHighlights: [
      "Pixel-perfect from Figma",
      "Lighthouse-focused delivery",
      "Component library patterns",
      "Handoff documentation",
    ],
    packages: [
      sharedPackages.starter([
        "Landing + core pages",
        "Mobile-responsive layout",
        "Basic SEO setup",
        "Contact / lead forms",
      ]),
      sharedPackages.growth([
        "Multi-page marketing site",
        "Blog or docs section",
        "Scroll animations",
        "CMS integration",
        "Analytics setup",
      ]),
      sharedPackages.enterprise([
        "Complex dashboard UI",
        "Design system extension",
        "A/B-ready components",
        "Long-term UI partnership",
      ]),
    ],
    faqs: [
      {
        question: "Do you work from Figma designs?",
        answer:
          "Yes. I implement designs faithfully with Tailwind and shadcn-style components, or help refine UX when designs are still evolving.",
      },
      {
        question: "App Router or Pages Router?",
        answer:
          "I default to App Router for new projects — better data fetching, layouts, and SEO. I also maintain legacy Pages Router codebases when needed.",
      },
      {
        question: "How do you handle animations?",
        answer:
          "Framer Motion for scroll and interaction, with prefers-reduced-motion respected. Animations are purposeful, not decorative noise.",
      },
    ],
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
    longDescription:
      "Practical AI integrations — RAG chatbots, workflow automation, and LLM-powered features embedded in your product, with guardrails, monitoring, and costs under control.",
    tags: ["OpenAI", "LangChain", "Python", "Node.js"],
    gallery: [
      "/services/ai-automation-chatbots.svg",
      "/services/ai-automation-chatbots.svg",
    ],
    included: [
      "Use-case discovery & prompt design",
      "RAG pipeline (vector DB + embeddings)",
      "Chat UI or API integration",
      "Tool calling & function routing",
      "Rate limiting & cost controls",
      "Evaluation & safety guardrails",
      "Workflow automation (n8n/custom)",
      "Documentation & operator guide",
    ],
    sidebarHighlights: [
      "Production-ready, not demos",
      "Token cost optimization",
      "Human handoff flows",
      "Monitoring & logging",
    ],
    packages: [
      sharedPackages.starter([
        "Single-purpose chatbot",
        "Knowledge base ingestion",
        "Embed on website",
        "Basic analytics",
      ]),
      sharedPackages.growth([
        "Multi-channel bot",
        "CRM/helpdesk integration",
        "Custom tools & APIs",
        "A/B prompt testing",
        "Usage dashboards",
      ]),
      sharedPackages.enterprise([
        "Enterprise RAG at scale",
        "Fine-tuning advisory",
        "Compliance review support",
        "Ongoing model updates",
      ]),
    ],
    faqs: [
      {
        question: "Which LLM providers do you support?",
        answer:
          "Primarily OpenAI and Anthropic APIs. I also work with open models via Ollama or hosted inference when privacy or cost requires it.",
      },
      {
        question: "How do you reduce hallucinations?",
        answer:
          "RAG with curated documents, citation-style responses, confidence thresholds, and human escalation paths for edge cases.",
      },
      {
        question: "Can AI automate our internal workflows?",
        answer:
          "Yes — email triage, data extraction, report generation, and webhook-driven automations using LangChain, Python, or n8n.",
      },
    ],
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
    longDescription:
      "Reliable cloud infrastructure and DevOps practices — IaC, CI/CD, container orchestration, and observability so your team ships fast without sacrificing uptime or security.",
    tags: ["AWS", "Docker", "GitHub Actions", "Terraform"],
    gallery: [
      "/services/cloud-infrastructure-devops.svg",
      "/services/cloud-infrastructure-devops.svg",
    ],
    included: [
      "Infrastructure audit & roadmap",
      "Terraform or CloudFormation IaC",
      "Docker containerization",
      "CI/CD pipeline (GitHub Actions)",
      "Staging & production environments",
      "SSL, DNS & CDN configuration",
      "Monitoring & alerting setup",
      "Runbooks & incident playbooks",
    ],
    sidebarHighlights: [
      "Security-first defaults",
      "Cost optimization review",
      "Zero-downtime deploys",
      "Team DevOps training",
    ],
    packages: [
      sharedPackages.starter([
        "Single-app deployment",
        "Docker + compose",
        "Basic CI pipeline",
        "HTTPS & domain setup",
      ]),
      sharedPackages.growth([
        "Multi-environment IaC",
        "Auto-scaling policies",
        "Centralized logging",
        "Backup & restore plan",
        "GitHub Actions workflows",
      ]),
      sharedPackages.enterprise([
        "Kubernetes cluster setup",
        "Multi-region architecture",
        "SOC2-ready hardening",
        "24/7 on-call advisory",
      ]),
    ],
    faqs: [
      {
        question: "AWS, GCP, or DigitalOcean?",
        answer:
          "I work across all three. AWS for enterprise scale, GCP for data/ML workloads, DigitalOcean for lean startups — recommendation depends on your stack and budget.",
      },
      {
        question: "Do you manage Kubernetes?",
        answer:
          "Yes — EKS, GKE, or managed alternatives. I also help teams avoid K8s complexity when simpler orchestration suffices.",
      },
      {
        question: "Can you migrate our existing servers?",
        answer:
          "Yes. I plan phased migrations with rollback paths, minimal downtime, and validation at each stage.",
      },
    ],
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
    longDescription:
      "Cross-platform mobile apps with Flutter or React Native — polished UX, offline support, push notifications, and full App Store and Play Store submission support.",
    tags: ["Flutter", "Dart", "Expo", "React Native"],
    gallery: [
      "/services/mobile-app-development.svg",
      "/services/mobile-app-development.svg",
    ],
    included: [
      "UX flows & wireframe alignment",
      "Cross-platform UI implementation",
      "API integration & auth",
      "Push notifications",
      "Offline-first patterns",
      "App Store & Play Store assets",
      "Beta testing (TestFlight/Internal)",
      "Store submission support",
    ],
    sidebarHighlights: [
      "iOS & Android from one codebase",
      "Performance profiling",
      "Analytics integration",
      "Post-launch bug-fix window",
    ],
    packages: [
      sharedPackages.starter([
        "Core screens & navigation",
        "API-connected MVP",
        "Basic push notifications",
        "TestFlight / internal testing",
      ]),
      sharedPackages.growth([
        "Full feature app",
        "Offline sync",
        "In-app purchases setup",
        "Deep linking",
        "Store listing & submission",
      ]),
      sharedPackages.enterprise([
        "Native module bridges",
        "Enterprise MDM support",
        "Long-term feature roadmap",
        "Dedicated release cadence",
      ]),
    ],
    faqs: [
      {
        question: "Flutter or React Native?",
        answer:
          "Flutter for pixel-perfect custom UI and performance. React Native when your team is already React-heavy. I advise based on your roadmap and team skills.",
      },
      {
        question: "Do you handle app store submission?",
        answer:
          "Yes — metadata, screenshots guidance, privacy manifests, and submission through App Store Connect and Google Play Console.",
      },
      {
        question: "Can the app share code with our web app?",
        answer:
          "Often yes — shared API clients, auth flows, and business logic. I align mobile and web architecture when you have both.",
      },
    ],
  },
];

export function getServiceSlugs(): string[] {
  return services.map((s) => s.slug);
}

export function getServiceBySlug(slug: string): ServiceDetail | undefined {
  return services.find((s) => s.slug === slug);
}

/** Listing-only projection for the services index page. */
export function getServiceListings(): ServiceListingItem[] {
  return services;
}
