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
  lead: "I follow a structured, results-driven process that turns complex challenges into scalable, high-performing products.",
  stepNames: ["Discover", "Architect", "Build", "Test", "Deploy"] as const,
  steps: [
    {
      title: "Discover",
      description:
        "Dig into business goals, users, and technical constraints to define a clear roadmap.",
      icon: "lucide:eye",
    },
    {
      title: "Architect",
      description:
        "Scalable schemas, high-performance APIs, and UI frameworks built for long-term growth.",
      icon: "lucide:map",
    },
    {
      title: "Build",
      description:
        "Agile sprints on modern stacks — Laravel, Node, Next.js, Vue — with automation where it helps.",
      icon: "lucide:layout",
    },
    {
      title: "Test",
      description:
        "Security, performance, and cross-browser testing for a flawless experience.",
      icon: "lucide:cpu",
    },
    {
      title: "Deploy",
      description:
        "Automated CI/CD, SEO, and proactive maintenance on AWS for sustained impact.",
      icon: "lucide:rocket",
    },
  ] satisfies HowWeWorkStep[],
  terminal: {
    title: "twixr · deployment",
    lines: [
      { kind: "cmd" as const, text: "$ twixr deploy" },
      { kind: "ok" as const, text: "Tests passing" },
      { kind: "ok" as const, text: "Docker image built" },
      { kind: "ok" as const, text: "Migrations run" },
      { kind: "ok" as const, text: "Deployed to AWS" },
      { kind: "run" as const, text: "Live in production…" },
    ],
  },
  inPractice: {
    eyebrow: "In practice",
    headingLine1: "From whiteboard to",
    headingLine2: "production.",
    body: "The same steps run on every engagement — discovery becomes architecture, architecture becomes a pipeline, and the pipeline is what ships. No theatre, no mystery phase after “done.”",
  },
} as const;

/** @deprecated Use howWeWork.steps — kept for lib/data re-exports. */
export const approachSteps = howWeWork.steps.map((step) => ({
  ...step,
  color: "indigo",
}));
