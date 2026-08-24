export const offerings = [
  {
    audience: "For startups & founders",
    title: "Your first SaaS, shipped properly.",
    desc: "End-to-end Laravel/Node/Next.js so v1 is something you can actually run - not a demo that dies in staging.",
    cta: { label: "Get in touch", href: "/contact" },
  },
  {
    audience: "For agencies",
    title: "Senior Laravel & Node overflow.",
    desc: "Embed as lead engineering on client work at scale: architecture, delivery, and honest velocity.",
    cta: { label: "Get in touch", href: "/contact" },
  },
  {
    audience: "For CTOs & product teams",
    title: "Architecture, migrations & rescue.",
    desc: "Monolith ↔ microservices, refactors, and rebuilding what was architected poorly - plus AI automation where it pays off.",
    cta: { label: "Get in touch", href: "/contact" },
  },
] as const;

export const extendedTeam = {
  heading: "A senior engineer who embeds like a partner.",
  body: "I don't hand you a ticket queue. I ask the right questions, own the architecture, and treat your product like it's mine - which is why clients stay 2 - 4 years. AI and automation come in where they cut real time, not as a buzzword.",
  chips: [
    "Senior engineering",
    "Architecture-first",
    "Automation where it pays",
    "Long-term partner",
  ],
} as const;

export const services = [
  {
    title: "SaaS & Web Apps",
    description:
      "End-to-end Laravel, Node, and Next.js so v1 is something you can actually run - not a demo that dies in staging.",
    icon: "Code2",
  },
  {
    title: "Laravel & Node APIs",
    description:
      "High-performance APIs with auth, billing, and data isolation designed in from day one.",
    icon: "Server",
  },
  {
    title: "Next.js / Vue Frontends",
    description:
      "Production frontends that stay fast, accessible, and maintainable as the product grows.",
    icon: "Database",
  },
  {
    title: "Cloud & DevOps",
    description:
      "CI/CD, Docker, and AWS (EC2, RDS, S3, ElastiCache) with zero-downtime deploys.",
    icon: "Cloud",
  },
  {
    title: "E-commerce & Payments",
    description:
      "Custom storefronts and checkout, Stripe/PayPal, plus Shopify integrations.",
    icon: "Cpu",
  },
  {
    title: "Rescue & Migrations",
    description:
      "Rebuild what was architected poorly, and migrate between monolith and microservices.",
    icon: "Wrench",
  },
] as const;

export const skills = {
  backend: ["PHP", "Laravel", "Node.js", "Python"],
  frontend: ["Next.js", "React.js", "Vue.js", "Nuxt", "Tailwind CSS", "TypeScript"],
  devops: ["AWS", "Docker", "CI/CD", "Nginx", "Linux"],
  database: ["PostgreSQL", "MySQL", "Redis"],
} as const;
