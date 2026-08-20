export type PortfolioCategoryId =
  | "saas"
  | "ai"
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

// Real projects from Ali's actual work history (LinkedIn + Upwork). Metrics are
// factual/qualitative — no invented percentages. Images are representative stock
// visuals; swap in real product screenshots under /public/projects when available.
const baseProjects: PortfolioProject[] = [
  {
    slug: "leadquiz-saas-funnel-platform",
    title: "LeadQuiz — SaaS Lead-Funnel Platform",
    description:
      "Full-stack SaaS that lets agencies build high-converting lead funnels — drag-and-drop builder with 30+ templates, custom domains, conditional lead scoring, and multi-client management, on AWS microservices.",
    categoryId: "saas",
    categoryLabel: "SaaS",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop",
    tags: ["NestJS", "React", "PostgreSQL", "AWS"],
    year: "2026",
    client: "LeadQuiz (US)",
    featured: true,
    metrics: [
      { label: "Funnel templates", value: "30+" },
      { label: "Architecture", value: "Microservices" },
    ],
  },
  {
    slug: "manageph-contractor-payments-platform",
    title: "ManagePH — Contractor Payments & Team Platform",
    description:
      "Global contractor payment and team-management platform — onboarding, role-based workspaces, and payment workflows built on Laravel and React with automated CI/CD on AWS.",
    categoryId: "saas",
    categoryLabel: "SaaS",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
    tags: ["Laravel", "React", "AWS", "CI/CD"],
    year: "2025",
    client: "ManagePH",
    featured: true,
    metrics: [
      { label: "Scope", value: "Payments + Teams" },
      { label: "Reach", value: "Global contractors" },
    ],
  },
  {
    slug: "propdaddy-real-estate-platform",
    title: "PropDaddy — Real-Estate Web Platform",
    description:
      "Real-estate platform with an in-app Twilio softphone, cron-driven automation, and multi-channel outreach (SendGrid, IMAP, Slybroadcast, Twilio) backed by VPS queue workers and skip tracing.",
    categoryId: "saas",
    categoryLabel: "SaaS",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop",
    tags: ["Laravel", "Twilio", "MySQL", "AWS"],
    year: "2024",
    client: "PropDaddy.com (US)",
    metrics: [
      { label: "In-app calling", value: "Twilio" },
      { label: "Outreach channels", value: "4+" },
    ],
  },
  {
    slug: "forage-b2b-saas",
    title: "Forage — B2B SaaS for D2C Brands",
    description:
      "B2B SaaS product enabling direct-to-consumer brands to offer consumers new experiences — built with Laravel and Inertia. A repeat, multi-project engagement.",
    categoryId: "saas",
    categoryLabel: "SaaS",
    image:
      "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=1200&auto=format&fit=crop",
    tags: ["Laravel", "Inertia", "Vue", "MySQL"],
    year: "2025",
    client: "Forage (D2C SaaS)",
    metrics: [
      { label: "Model", value: "B2B SaaS" },
      { label: "Relationship", value: "Repeat client" },
    ],
  },
  {
    slug: "gaming-ecommerce-store",
    title: "Full-Stack E-commerce for Gaming Services",
    description:
      "Full-stack e-commerce platform for a gaming-services business — custom storefront, checkout, and order flows in PHP/Laravel. The engagement earned a 5.0★ review and repeat work.",
    categoryId: "ecommerce",
    categoryLabel: "E-commerce",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
    tags: ["Laravel", "PHP", "Stripe", "MySQL"],
    year: "2025",
    client: "Gaming e-commerce (US)",
    metrics: [
      { label: "Client rating", value: "5.0★" },
      { label: "Type", value: "Full-stack store" },
    ],
  },
  {
    slug: "ai-content-automation",
    title: "AI Content Automation (Gemini)",
    description:
      "Laravel application with the Google Gemini API wired into content generation — tuned prompts and parameters for high-quality output, plus Tailwind UIs with real-time validation.",
    categoryId: "ai",
    categoryLabel: "AI & Automation",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop",
    tags: ["Laravel", "Gemini API", "Tailwind", "PHP"],
    year: "2024",
    client: "Local Spark Solutions (US)",
    metrics: [
      { label: "AI model", value: "Gemini API" },
      { label: "UX", value: "Real-time validation" },
    ],
  },
  {
    slug: "aws-cicd-vue-laravel-dashboards",
    title: "AWS CI/CD & Vue + Laravel Dashboards",
    description:
      "Vue.js and Laravel dashboards deployed on AWS with CodePipeline CI/CD, Elastic Beanstalk, RDS, CloudFront, and S3 — secure, scalable hosting with streamlined releases.",
    categoryId: "devops",
    categoryLabel: "Cloud & DevOps",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
    tags: ["AWS", "CodePipeline", "Laravel", "Vue"],
    year: "2023",
    client: "Applis Technologies (US)",
    metrics: [
      { label: "Deploys", value: "CodePipeline" },
      { label: "Hosting", value: "Elastic Beanstalk" },
    ],
  },
];

export const portfolioCaseStudies: PortfolioCaseStudy[] = [
  buildCaseStudy(baseProjects[0], {
    longDescription:
      "LeadQuiz is a full-stack SaaS that lets agencies build and run high-converting lead funnels for their clients. It pairs a drag-and-drop funnel builder (30+ templates) with custom domains, conditional lead scoring, auto-disqualification, role-based team access, and CRM-style workflows — all on an AWS microservices backend.",
    gallery: [
      baseProjects[0].image,
      "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1200&auto=format&fit=crop",
    ],
    challenge:
      "Agencies needed one workspace to manage funnels for many clients — with isolation between accounts, flexible funnel logic, and reliable delivery of leads into whatever CRM each client already used.",
    solution:
      "Built a NestJS + React application on an AWS microservices architecture (ECS, RDS/PostgreSQL, S3). Delivered the drag-and-drop builder, conditional scoring, custom domains, Zapier and webhook integrations to sync leads to any CRM, and scheduled weekly per-client summary reports.",
    outcomes: [
      "Drag-and-drop funnel builder with 30+ templates",
      "Custom domains and conditional lead scoring per funnel",
      "Zapier + webhook sync into any client CRM",
      "Automated weekly per-client reporting on schedule",
    ],
    timeline: "2026 · Ongoing",
    role: "Full-Stack Developer & DevOps Engineer",
    techStack: ["NestJS", "React", "PostgreSQL", "Docker", "AWS (ECS, RDS, S3)"],
  }),
  buildCaseStudy(baseProjects[1], {
    longDescription:
      "ManagePH is a global contractor payment and team-management platform. It handles contractor onboarding, role-based team workspaces, and payment workflows so distributed teams can manage people and payouts in one place.",
    gallery: [
      baseProjects[1].image,
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop",
    ],
    challenge:
      "Managing global contractors meant juggling onboarding, team structure, and payments across tools — the client wanted a single platform with clean workflows and dependable deployments.",
    solution:
      "Delivered a Laravel + React platform with team and role management, payment workflows, and automated CI/CD to AWS for repeatable, low-risk releases.",
    outcomes: [
      "Unified contractor onboarding and team management",
      "Payment workflows for global contractors",
      "Role-based access across workspaces",
      "Automated CI/CD delivery on AWS",
    ],
    timeline: "2025",
    role: "Full-Stack Engineer",
    techStack: ["Laravel", "React", "MySQL", "AWS", "CI/CD"],
  }),
  buildCaseStudy(baseProjects[2], {
    longDescription:
      "A real-estate web platform where agents work leads end to end. The build added an in-app calling experience, automated outreach across several channels, and the background infrastructure to keep it all running reliably.",
    challenge:
      "The team needed to call and follow up with prospects without leaving the app, run multi-channel campaigns, and keep large volumes of contact data clean and current.",
    solution:
      "Optimized database queries, orchestrated complex cron automation, integrated a Twilio softphone for in-app calling, and wired SendGrid, IMAP, Slybroadcast, and Twilio for campaign management — supervised by VPS queue workers with skip tracing to consolidate records.",
    outcomes: [
      "In-app calling via an integrated Twilio softphone",
      "Multi-channel outreach (SendGrid, IMAP, Slybroadcast, Twilio)",
      "Cron-driven automation with supervised queue workers",
      "Skip tracing to consolidate and clean contact records",
    ],
    timeline: "2023 – 2024",
    role: "Full-Stack Developer",
    techStack: ["Laravel", "Twilio", "MySQL", "SendGrid", "VPS / Queues"],
  }),
  buildCaseStudy(baseProjects[3], {
    longDescription:
      "Forage provides a B2B SaaS product for direct-to-consumer (D2C) brands. Ali contributed as a Laravel + Inertia full-stack developer on the SaaS product across a repeat, multi-project relationship.",
    challenge:
      "The product needed reliable full-stack delivery and clear communication to keep shipping features as the SaaS matured.",
    solution:
      "Worked as a Laravel + Inertia full-stack developer, delivering features with clear communication — the kind of partnership that led the client to continue working together on further projects.",
    outcomes: [
      "Full-stack feature delivery on a live B2B SaaS",
      "Laravel + Inertia application work",
      "Repeat, multi-project client relationship",
      "“Clear communication and a subject-matter expert” — client review",
    ],
    timeline: "2024 – 2025",
    role: "Full-Stack Developer",
    techStack: ["Laravel", "Inertia", "Vue", "MySQL"],
  }),
  buildCaseStudy(baseProjects[4], {
    longDescription:
      "A full-stack e-commerce platform for a gaming-services business — a custom storefront with checkout and order management built in PHP/Laravel. The engagement earned a 5.0★ review and became one of Ali's standout client relationships.",
    challenge:
      "The client needed a reliable, custom storefront for selling gaming services, with the flexibility a templated store couldn't offer.",
    solution:
      "Built the storefront, checkout, and order flows in PHP/Laravel, focusing on quality and value — the work the client described as coming from “the best developer I've ever worked with.”",
    outcomes: [
      "Custom full-stack e-commerce storefront",
      "Checkout and order-management flows",
      "5.0★ client review",
      "Competitive value that earned repeat trust",
    ],
    timeline: "2024 – 2025",
    role: "Full-Stack Developer",
    techStack: ["Laravel", "PHP", "Stripe", "MySQL"],
  }),
  buildCaseStudy(baseProjects[5], {
    longDescription:
      "A Laravel application with the Google Gemini API integrated into content generation. Beyond the AI work, the engagement improved performance across key parts of the app and added polished, real-time-validated UIs.",
    challenge:
      "The client wanted high-quality, unique generated content plus faster, more reliable pages and a better user experience.",
    solution:
      "Integrated the Gemini API with tuned prompts and parameters for quality output, optimized key parts of the application, hardened backend code, and built Tailwind UIs with real-time validation. Managed everything through GitHub with secure SSH server access.",
    outcomes: [
      "Gemini API integrated for content generation",
      "Real-time-validated UIs in Tailwind CSS",
      "Performance and backend improvements",
      "Delivered on deadline with clear team communication",
    ],
    timeline: "2024",
    role: "Full-Stack PHP / Laravel Developer",
    techStack: ["Laravel", "Google Gemini API", "Tailwind CSS", "PHP", "GitHub"],
  }),
  buildCaseStudy(baseProjects[6], {
    longDescription:
      "As a senior backend Laravel developer, Ali built and maintained Vue.js + Laravel dashboards and owned their deployment on AWS — streamlining releases and keeping hosting secure and scalable.",
    challenge:
      "Dashboards needed dependable, repeatable deployments and scalable, secure hosting without manual, error-prone release steps.",
    solution:
      "Developed Vue.js + Laravel dashboards and leveraged AWS CodePipeline with GitHub for streamlined deployments, using Elastic Beanstalk, RDS, CloudFront, and S3 for secure, scalable hosting.",
    outcomes: [
      "Vue.js + Laravel dashboards, built and maintained",
      "Streamlined deploys via AWS CodePipeline + GitHub",
      "Elastic Beanstalk, RDS, CloudFront, and S3 hosting",
      "Secure, scalable production infrastructure",
    ],
    timeline: "2021 – 2023",
    role: "Senior Backend Laravel Developer",
    techStack: ["AWS", "CodePipeline", "Elastic Beanstalk", "Laravel", "Vue"],
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
