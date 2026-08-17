import { site } from "./site";

export const support = {
  eyebrow: "Support Hub",
  headingBefore: "Let's build your next",
  headingEmphasis: "product.",
  lead: "Can't find what you're looking for? Contact me directly — I'll tell you plainly if I'm the right engineer for it.",
  primaryCta: site.ctas.start,
  secondaryCta: site.ctas.portfolio,
  waysEyebrow: "Three ways in",
  contactLabel: "Get in touch",
  contactHref: site.bookingHref,
  faqHeading: "Common questions",
  audiences: [
    {
      eyebrow: "For startups",
      title: "First product, shipped properly.",
      body: "End-to-end full-stack — Next.js, Laravel, mobile, and the cloud — so your first version is something you can actually run, not a demo that dies in staging.",
    },
    {
      eyebrow: "For agencies",
      title: "Senior overflow, not extra management.",
      body: "I embed as lead engineering on client work: architecture, delivery, and an AI-assisted workflow that keeps velocity honest without adding a layer of process.",
    },
    {
      eyebrow: "For product teams",
      title: "Architecture, AI, and a second brain.",
      body: "RAG pipelines, automation, code review, and mentoring — the same consultancy I already do for in-house teams who need a senior engineer without hiring one full-time.",
    },
  ],
} as const;
