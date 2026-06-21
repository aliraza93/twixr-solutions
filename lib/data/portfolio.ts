export type PortfolioCategoryId =
  | "saas"
  | "ai"
  | "mobile"
  | "ecommerce"
  | "devops";

export type PortfolioProject = {
  slug: string;
  title: string;
  description: string;
  categoryId: PortfolioCategoryId;
  categoryLabel: string;
  image: string;
  tags: readonly string[];
  year: string;
  client: string;
  link?: string;
  featured?: boolean;
  metrics: readonly { label: string; value: string }[];
};

export type PortfolioCaseStudy = PortfolioProject & {
  longDescription: string;
  gallery: string[];
  challenge: string;
  solution: string;
  outcomes: string[];
  deliverables: string[];
  timeline: string;
  role: string;
  techStack: string[];
};

export const portfolioCategories: {
  id: "all" | PortfolioCategoryId;
  label: string;
}[] = [
  { id: "all", label: "All work" },
  { id: "saas", label: "SaaS" },
  { id: "ai", label: "AI & Automation" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "mobile", label: "Mobile" },
  { id: "devops", label: "Cloud & DevOps" },
];

const caseStudyExtras = {
  challenge:
    "The client needed a production-grade solution that could scale with user growth, integrate with existing tools, and ship quickly without sacrificing code quality or maintainability.",
  solution:
    "I led architecture and full-stack delivery — from discovery and system design through implementation, testing, and deployment — using modern patterns, automated CI/CD, and clear documentation for handoff.",
  outcomes: [
    "Reduced manual workflows and improved team velocity",
    "Shipped on schedule with measurable performance gains",
    "Established a scalable foundation for future feature releases",
    "Documented APIs and runbooks for long-term maintainability",
  ],
  deliverables: [
    "Technical architecture & system design",
    "Full-stack application development",
    "Database schema & API design",
    "Automated testing & CI/CD pipeline",
    "Deployment & monitoring setup",
    "Documentation & knowledge transfer",
  ],
};

function buildCaseStudy(
  project: PortfolioProject,
  extras: Partial<
    Pick<
      PortfolioCaseStudy,
      | "longDescription"
      | "gallery"
      | "challenge"
      | "solution"
      | "outcomes"
      | "deliverables"
      | "timeline"
      | "role"
      | "techStack"
    >
  >
): PortfolioCaseStudy {
  return {
    ...project,
    longDescription:
      extras.longDescription ??
      `${project.description} This case study covers the approach, stack, and measurable outcomes from end-to-end delivery.`,
    gallery: extras.gallery ?? [project.image, project.image],
    challenge: extras.challenge ?? caseStudyExtras.challenge,
    solution: extras.solution ?? caseStudyExtras.solution,
    outcomes: extras.outcomes ?? caseStudyExtras.outcomes,
    deliverables: extras.deliverables ?? caseStudyExtras.deliverables,
    timeline: extras.timeline ?? `${project.year} · 8–12 weeks`,
    role: extras.role ?? "Lead Full Stack Engineer",
    techStack: extras.techStack ?? [...project.tags],
  };
}

const baseProjects: PortfolioProject[] = [
  {
    slug: "ai-proposal-engine",
    title: "AI Proposal Engine",
    description:
      "GPT-powered proposal generator that drafts client-ready scopes from brief inputs, cutting sales prep time by 70%.",
    categoryId: "ai",
    categoryLabel: "AI & Automation",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop",
    tags: ["OpenAI", "Next.js", "Laravel", "RAG"],
    year: "2025",
    client: "Twixr Solutions",
    link: "https://twixrsolutions.com",
    featured: true,
    metrics: [
      { label: "Faster proposals", value: "70%" },
      { label: "Active users", value: "120+" },
    ],
  },
  {
    slug: "custom-saas-platform",
    title: "Custom SaaS Platform",
    description:
      "Multi-tenant B2B platform with role-based access, Stripe billing, and real-time analytics for a global client.",
    categoryId: "saas",
    categoryLabel: "SaaS",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop",
    tags: ["Next.js", "Laravel", "Stripe", "PostgreSQL"],
    year: "2024",
    client: "Confidential — B2B",
    featured: true,
    metrics: [
      { label: "Monthly users", value: "15K+" },
      { label: "Uptime", value: "99.9%" },
    ],
  },
  {
    slug: "enterprise-analytics-dashboard",
    title: "Enterprise Analytics Dashboard",
    description:
      "Executive dashboard aggregating ops, revenue, and support KPIs with drill-down views and exportable reports.",
    categoryId: "saas",
    categoryLabel: "SaaS",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
    tags: ["React", "Node.js", "Chart.js", "AWS"],
    year: "2024",
    client: "Enterprise client",
    metrics: [
      { label: "Data sources", value: "12" },
      { label: "Load time", value: "<2s" },
    ],
  },
  {
    slug: "upwork-automation-suite",
    title: "Upwork Automation Suite",
    description:
      "Workflow automation for job alerts, proposal templates, and client follow-ups integrated with CRM pipelines.",
    categoryId: "ai",
    categoryLabel: "AI & Automation",
    image:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop",
    tags: ["n8n", "OpenAI", "Zapier", "API"],
    year: "2023",
    client: "Freelance ops",
    metrics: [
      { label: "Hours saved / wk", value: "12+" },
      { label: "Automations", value: "24" },
    ],
  },
  {
    slug: "laravel-multitenant-api",
    title: "Laravel Multi-tenant API",
    description:
      "Scalable REST API with tenant isolation, OAuth2, queue workers, and comprehensive test coverage for a SaaS startup.",
    categoryId: "saas",
    categoryLabel: "SaaS",
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop",
    tags: ["Laravel", "PostgreSQL", "Redis", "PHPUnit"],
    year: "2023",
    client: "SaaS startup",
    metrics: [
      { label: "API endpoints", value: "80+" },
      { label: "Test coverage", value: "92%" },
    ],
  },
  {
    slug: "ecommerce-growth-platform",
    title: "E-commerce Growth Platform",
    description:
      "Headless storefront with custom checkout, inventory sync, and conversion-focused product pages for a DTC brand.",
    categoryId: "ecommerce",
    categoryLabel: "E-commerce",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop",
    tags: ["Next.js", "Stripe", "Shopify API", "Tailwind"],
    year: "2022",
    client: "DTC brand",
    metrics: [
      { label: "Conversion lift", value: "34%" },
      { label: "Page speed", value: "95+" },
    ],
  },
  {
    slug: "flutter-field-service-app",
    title: "Flutter Field Service App",
    description:
      "Offline-first mobile app for technicians with job scheduling, photo uploads, and signature capture synced to Laravel backend.",
    categoryId: "mobile",
    categoryLabel: "Mobile",
    image:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1200&auto=format&fit=crop",
    tags: ["Flutter", "Laravel", "Firebase", "Maps"],
    year: "2022",
    client: "Field services co.",
    metrics: [
      { label: "Active techs", value: "200+" },
      { label: "Offline sync", value: "100%" },
    ],
  },
  {
    slug: "cloud-cicd-pipeline",
    title: "Cloud CI/CD Pipeline",
    description:
      "Zero-downtime deployment pipeline on AWS with Docker, GitHub Actions, staging previews, and Sentry monitoring.",
    categoryId: "devops",
    categoryLabel: "Cloud & DevOps",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
    tags: ["AWS", "Docker", "GitHub Actions", "Sentry"],
    year: "2024",
    client: "Multiple clients",
    metrics: [
      { label: "Deploy time", value: "4 min" },
      { label: "Incidents", value: "−60%" },
    ],
  },
];

export const portfolioCaseStudies: PortfolioCaseStudy[] = [
  buildCaseStudy(baseProjects[0], {
    longDescription:
      "An internal Twixr tool that turns rough client briefs into structured proposals using GPT-4 and a custom RAG pipeline over past project scopes. Sales prep dropped from hours to minutes while keeping tone and pricing consistent.",
    gallery: [
      baseProjects[0].image,
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop",
    ],
    challenge:
      "Proposal writing was a bottleneck — each scope took 2–4 hours of manual drafting, and quality varied between team members.",
    solution:
      "Built a Next.js frontend with Laravel API, vector store over historical proposals, and prompt templates tuned for scope sections (timeline, stack, deliverables).",
    outcomes: [
      "70% reduction in proposal drafting time",
      "120+ active internal users within first quarter",
      "Consistent scope structure across all outbound proposals",
      "RAG retrieval improved relevance of past-project references",
    ],
    timeline: "2025 · 6 weeks",
    role: "Founder & Lead Engineer",
    techStack: ["Next.js", "Laravel", "OpenAI", "Pinecone", "PostgreSQL", "Tailwind CSS"],
  }),
  buildCaseStudy(baseProjects[1], {
    longDescription:
      "End-to-end B2B SaaS with multi-tenant architecture, Stripe subscriptions, admin analytics, and role-based dashboards. Designed for a global client scaling from pilot to thousands of monthly active users.",
    gallery: [
      baseProjects[1].image,
      "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1200&auto=format&fit=crop",
    ],
    challenge:
      "The client needed a secure multi-tenant platform with billing, onboarding, and analytics — all within a tight launch window.",
    solution:
      "Delivered tenant-isolated Laravel API, Next.js App Router frontend, Stripe Billing integration, and real-time admin dashboards with WebSocket updates.",
    outcomes: [
      "15K+ monthly active users post-launch",
      "99.9% uptime on AWS with auto-scaling",
      "Subscription billing live in 3 pricing tiers",
      "Onboarding flow reduced time-to-value by 40%",
    ],
    timeline: "2024 · 12 weeks",
    techStack: ["Next.js", "Laravel", "Stripe", "PostgreSQL", "Redis", "AWS", "Docker"],
  }),
  buildCaseStudy(baseProjects[2], {
    longDescription:
      "Unified executive dashboard pulling from 12 data sources — revenue, ops, support, and product metrics — with drill-down views, date filters, and PDF export for board reporting.",
    challenge:
      "Leadership relied on fragmented spreadsheets; no single source of truth for weekly business reviews.",
    solution:
      "Built React dashboard with Node.js aggregation layer, cached queries, and Chart.js visualizations with role-based access control.",
    outcomes: [
      "12 integrated data sources in one view",
      "Sub-2s load time on primary dashboard",
      "Weekly reporting time cut from 4 hours to 20 minutes",
      "Exportable PDF packs for board meetings",
    ],
    timeline: "2024 · 10 weeks",
    techStack: ["React", "Node.js", "Chart.js", "PostgreSQL", "AWS Lambda", "Redis"],
  }),
  buildCaseStudy(baseProjects[3], {
    longDescription:
      "Automation hub connecting Upwork job feeds, CRM, and AI-assisted proposal drafts — 24 active workflows saving 12+ hours per week on repetitive freelance ops.",
    challenge:
      "Manual job monitoring and follow-ups consumed most of the work week, with missed opportunities on time-sensitive postings.",
    solution:
      "Orchestrated n8n workflows with OpenAI nodes, Zapier bridges, and custom webhooks into a lightweight admin UI for template management.",
    outcomes: [
      "12+ hours saved per week on ops tasks",
      "24 automations running with 99% reliability",
      "Faster response time on high-fit job postings",
      "CRM sync eliminated duplicate data entry",
    ],
    timeline: "2023 · 5 weeks",
    techStack: ["n8n", "OpenAI", "Zapier", "Node.js", "PostgreSQL", "REST APIs"],
  }),
  buildCaseStudy(baseProjects[4], {
    longDescription:
      "Production Laravel API serving a SaaS startup with strict tenant isolation, OAuth2, queued jobs, and 92% test coverage — 80+ documented endpoints.",
    challenge:
      "Early MVP needed to support multiple tenants securely while the team planned rapid feature expansion.",
    solution:
      "Implemented database-per-tenant pattern, Passport OAuth2, Horizon queues, and comprehensive PHPUnit + Pest test suites with CI gates.",
    outcomes: [
      "80+ REST endpoints with OpenAPI docs",
      "92% automated test coverage",
      "Zero cross-tenant data leaks in security audit",
      "Queue throughput handled 10x traffic spike",
    ],
    timeline: "2023 · 8 weeks",
    techStack: ["Laravel", "PostgreSQL", "Redis", "PHPUnit", "Pest", "Docker"],
  }),
  buildCaseStudy(baseProjects[5], {
    longDescription:
      "Headless commerce rebuild for a DTC brand — custom Next.js storefront, Shopify inventory sync, Stripe checkout, and conversion-optimized product pages.",
    challenge:
      "Legacy Shopify theme limited customization; checkout abandonment was high and page speed scores were below 70.",
    solution:
      "Headless architecture with Next.js ISR, Shopify Storefront API, custom Stripe Elements checkout, and A/B-tested product page layouts.",
    outcomes: [
      "34% lift in conversion rate post-launch",
      "Lighthouse performance score 95+",
      "Real-time inventory sync across channels",
      "Checkout completion improved by 22%",
    ],
    timeline: "2022 · 10 weeks",
    techStack: ["Next.js", "Stripe", "Shopify API", "Tailwind CSS", "Vercel", "Sanity CMS"],
  }),
  buildCaseStudy(baseProjects[6], {
    longDescription:
      "Offline-first Flutter app for 200+ field technicians — job scheduling, photo capture, digital signatures, and background sync to a Laravel API.",
    challenge:
      "Technicians worked in low-connectivity areas; paper workflows caused delays and data loss.",
    solution:
      "Built Flutter app with local SQLite cache, background sync queue, Firebase push notifications, and Laravel API with conflict resolution.",
    outcomes: [
      "200+ active technicians on platform",
      "100% offline job completion capability",
      "Paper workflows eliminated within 60 days",
      "Average job close-out time reduced by 45%",
    ],
    timeline: "2022 · 14 weeks",
    techStack: ["Flutter", "Dart", "Laravel", "Firebase", "SQLite", "Google Maps API"],
  }),
  buildCaseStudy(baseProjects[7], {
    longDescription:
      "Standardized CI/CD for multiple client projects — Dockerized builds, GitHub Actions pipelines, staging previews, blue-green deploys on AWS, and Sentry error tracking.",
    challenge:
      "Deployments were manual, error-prone, and caused downtime during releases across several production apps.",
    solution:
      "Designed reusable GitHub Actions workflows, ECS/Fargate deployment targets, preview environments per PR, and Sentry + CloudWatch alerting.",
    outcomes: [
      "Deploy time reduced to under 4 minutes",
      "60% fewer production incidents post-migration",
      "Staging previews on every pull request",
      "Rollback capability under 2 minutes",
    ],
    timeline: "2024 · 4 weeks",
    techStack: ["AWS", "Docker", "GitHub Actions", "ECS", "Sentry", "Terraform"],
  }),
];

export function getPortfolioProjects(): PortfolioProject[] {
  return portfolioCaseStudies.map(
    ({ longDescription, gallery, challenge, solution, outcomes, deliverables, timeline, role, techStack, ...project }) =>
      project
  );
}

export function getFeaturedProjects(): PortfolioProject[] {
  return getPortfolioProjects().filter((p) => p.featured);
}

export function getPortfolioSlugs(): string[] {
  return portfolioCaseStudies.map((p) => p.slug);
}

export function getPortfolioBySlug(slug: string): PortfolioCaseStudy | undefined {
  return portfolioCaseStudies.find((p) => p.slug === slug);
}

export function getRelatedProjects(slug: string, limit = 3): PortfolioProject[] {
  const current = getPortfolioBySlug(slug);
  const all = getPortfolioProjects().filter((p) => p.slug !== slug);
  if (!current) return all.slice(0, limit);

  const sameCategory = all.filter((p) => p.categoryId === current.categoryId);
  const pool = sameCategory.length >= limit ? sameCategory : all;
  return pool.slice(0, limit);
}
