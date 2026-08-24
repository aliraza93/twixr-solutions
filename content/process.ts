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
  lead: "Five phases, one loop - from the first workshop to traffic that holds. Touch a node to explore.",
  hub: { label: "Twixr", sub: "Delivery" },
  phases: [
    {
      id: "discover",
      title: "Discover",
      icon: "search",
      panel: {
        index: "01",
        logo: "Discovery",
        tagline: "Ask the hard questions first",
        desc: "Goals, users, constraints, and the system's future mapped into a plan you can ship against.",
        tools: ["Workshops", "Audits", "Architecture", "Roadmap"],
        stats: [
          { value: "100%", unit: "Alignment" },
          { value: "1 - 2 wks", unit: "Typical" },
        ],
        href: "#services",
      },
    },
    {
      id: "design",
      title: "Design",
      icon: "compass",
      panel: {
        index: "02",
        logo: "Architecture",
        tagline: "Built to grow",
        desc: "Schemas, APIs, and multi-tenant foundations designed to scale - monolith or microservices, chosen on merit.",
        tools: ["PostgreSQL", "REST APIs", "Multi-tenant", "System Design"],
        stats: [
          { value: "0", unit: "Rewrites" },
          { value: "N+1", unit: "Safe" },
        ],
        href: "#services",
      },
    },
    {
      id: "build",
      title: "Build",
      icon: "code",
      panel: {
        index: "03",
        logo: "Engineering",
        tagline: "Production-grade from merge one",
        desc: "Laravel, Node, Next.js & Vue in tight sprints - clean, tested, maintainable.",
        tools: ["Laravel", "Node.js", "Next.js", "Vue"],
        stats: [
          { value: "<200ms", unit: "TTFB" },
          { value: "CI/CD", unit: "Every merge" },
        ],
        href: "#services",
      },
    },
    {
      id: "ship",
      title: "Ship",
      icon: "rocket",
      panel: {
        index: "04",
        logo: "Launch",
        tagline: "Deploys that don't wake you",
        desc: "CI/CD, Docker, and AWS (EC2, RDS, S3, ElastiCache) with rollbacks built in.",
        tools: ["Docker", "CI/CD", "AWS", "Nginx"],
        stats: [
          { value: "Zero", unit: "Downtime" },
          { value: "1-click", unit: "Rollback" },
        ],
        href: "#services",
      },
    },
    {
      id: "scale",
      title: "Scale",
      icon: "trending",
      panel: {
        index: "05",
        logo: "Growth",
        tagline: "Headroom, not a rewrite",
        desc: "Queues, caching, and event-driven backends that hold when traffic spikes.",
        tools: ["Redis", "Queues", "CDN", "Autoscaling"],
        stats: [
          { value: "10×", unit: "Headroom" },
          { value: "100%", unit: "Job Success" },
        ],
        href: "#services",
      },
    },
  ] satisfies ProcessPhase[],
} as const;
