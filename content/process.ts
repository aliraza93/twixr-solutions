export type ProcessStat = { value: string; unit: string };

export type ProcessPhase = {
  id: string;
  title: string;
  icon: "search" | "compass" | "code" | "rocket" | "trending";
  panel: {
    index: string;
    logo: string;
    tagline: string;
    desc: string;
    tools: string[];
    stats: ProcessStat[];
    href: string;
  };
};

export const process = {
  eyebrow: "How I build",
  headingLine1: "One connected cycle.",
  headingLine2: "From idea to scale.",
  lead: "Five phases, one loop — from the first workshop to traffic that holds. Touch a node to explore.",
  hub: { label: "Twixr", sub: "Delivery" },
  phases: [
    {
      id: "discover",
      title: "Discover",
      icon: "search",
      panel: {
        index: "01",
        logo: "Discovery",
        tagline: "Clarity before a single line",
        desc: "Goals, users, and constraints get mapped into a roadmap the team can actually ship against.",
        tools: ["Workshops", "Audits", "Roadmaps", "KPI mapping"],
        stats: [
          { value: "2 wks", unit: "Typical" },
          { value: "100%", unit: "Alignment" },
        ],
        href: "#process",
      },
    },
    {
      id: "design",
      title: "Design",
      icon: "compass",
      panel: {
        index: "02",
        logo: "Architecture",
        tagline: "Systems built to last",
        desc: "Schemas, APIs, and UX flows designed for the product you will still be running in three years.",
        tools: ["Domain model", "API design", "Figma", "UX flows"],
        stats: [
          { value: "12+", unit: "Systems" },
          { value: "0", unit: "Rewrites" },
        ],
        href: "#process",
      },
    },
    {
      id: "build",
      title: "Build",
      icon: "code",
      panel: {
        index: "03",
        logo: "Engineering",
        tagline: "Ship the hard parts",
        desc: "Laravel, Next.js, and AI automation in tight sprints — production-grade from the first merge.",
        tools: ["Laravel", "Next.js", "PostgreSQL", "CI/CD"],
        stats: [
          { value: "99.9%", unit: "Uptime" },
          { value: "<200ms", unit: "TTFB" },
        ],
        href: "#process",
      },
    },
    {
      id: "ship",
      title: "Ship",
      icon: "rocket",
      panel: {
        index: "04",
        logo: "Launch",
        tagline: "Zero-drama deploys",
        desc: "Pipelines, observability, and a launch checklist that holds up when real traffic arrives.",
        tools: ["Docker", "AWS", "GitHub Actions", "Sentry"],
        stats: [
          { value: "<15m", unit: "Deploy" },
          { value: "24/7", unit: "Monitoring" },
        ],
        href: "#process",
      },
    },
    {
      id: "scale",
      title: "Scale",
      icon: "trending",
      panel: {
        index: "05",
        logo: "Growth",
        tagline: "From launch to load",
        desc: "Caching, queues, and infrastructure with headroom for the hockey stick — not a rewrite.",
        tools: ["Redis", "CDN", "Queues", "Autoscaling"],
        stats: [
          { value: "10×", unit: "Headroom" },
          { value: "99.99%", unit: "SLA" },
        ],
        href: "#process",
      },
    },
  ] satisfies ProcessPhase[],
} as const;
