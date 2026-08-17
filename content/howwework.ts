export type HowWeWorkStep = {
  title: string;
  description: string;
  icon: string;
};

export const howWeWork = {
  eyebrow: "How we work",
  headingLine1: "From a messy brief",
  headingLine2Before: "to a process that",
  headingEmphasis: "ships.",
  lead: "I follow a structured, results-driven process designed to transform complex challenges into scalable, high-performing solutions.",
  stepNames: ["Discover", "Architect", "Build", "Test", "Deploy"] as const,
  steps: [
    {
      title: "Strategy & Discovery",
      description:
        "We dive deep into your business goals, user needs, and technical requirements to define a clear roadmap for success.",
      icon: "lucide:eye",
    },
    {
      title: "Precision Architecture",
      description:
        "Designing scalable database schemas, high-performance APIs, and intuitive UI/UX frameworks built for long-term growth.",
      icon: "lucide:map",
    },
    {
      title: "High-Velocity Dev",
      description:
        "Agile sprints focused on building core features using modern stacks like Next.js, Laravel, and AI-powered automation.",
      icon: "lucide:layout",
    },
    {
      title: "Rigorous QA & Test",
      description:
        "Comprehensive testing for security, performance, and cross-device compatibility to ensure a flawless user experience.",
      icon: "lucide:cpu",
    },
    {
      title: "Global Launch & Scale",
      description:
        "Seamless deployment with automated CI/CD pipelines, SEO optimization, and proactive maintenance for sustained impact.",
      icon: "lucide:rocket",
    },
  ] satisfies HowWeWorkStep[],
  terminal: {
    title: "twixr · deployment",
    lines: [
      { kind: "cmd" as const, text: "$ twixr deployment" },
      { kind: "ok" as const, text: "Tests passing" },
      { kind: "ok" as const, text: "Docker image built" },
      { kind: "ok" as const, text: "Migrations run" },
      { kind: "ok" as const, text: "SSL & CDN configured" },
      { kind: "run" as const, text: "Deploying to production…" },
    ],
  },
  inPractice: {
    eyebrow: "In practice",
    headingLine1: "From whiteboard to",
    headingLine2: "production.",
    body: "The same five steps run on every engagement — discovery notes become architecture, architecture becomes a pipeline, and the pipeline is what ships. No theatre, no mystery phase after “done.”",
  },
} as const;

/** @deprecated Use howWeWork.steps — kept for lib/data re-exports. */
export const approachSteps = howWeWork.steps.map((step) => ({
  ...step,
  color: "indigo",
}));
