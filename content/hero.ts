import { site } from "./site";

export const hero = {
  eyebrow: "Full-stack engineering · SaaS · Cloud & DevOps",
  stableHeading: "Ship faster. Stay up. Cut the cloud bill.",
  // Retired: the hero states outcomes instead of cycling words.
  rotatingWords: [] as const,
  // One logical line; the heading finds its own rag from the measure.
  // Edit this from /admin/content/site as plain text with **emphasis**.
  headingLines: [
    [
      { text: "Ship", kind: "plain" as const },
      { text: "faster.", kind: "plain" as const },
      { text: "Stay", kind: "emphasis" as const },
      { text: "up.", kind: "emphasis" as const },
      { text: "Cut", kind: "plain" as const },
      { text: "the", kind: "plain" as const },
      { text: "cloud", kind: "plain" as const },
      { text: "bill.", kind: "plain" as const },
    ],
  ],
  subheading:
    "Multi-tenant SaaS, APIs and AWS infrastructure on Laravel, Node.js and Next.js - built to carry real traffic, survive launch day, and stay cheap to run.",
  proofChip: "Top Rated Plus · 100% Job Success · 4.7★ across 40 reviews",
  /** The ledger across the bottom of the fold. Real Upwork figures, at a size
   *  a visitor can actually read - they were previously ~11px inside a mock. */
  stats: [
    { label: "Job success", value: "100", unit: "%" },
    { label: "Hours delivered", value: "2,600", unit: "+" },
    { label: "Jobs shipped", value: "49", unit: "" },
    { label: "Years in", value: "8", unit: "+" },
  ],
  /** Inline social proof, as the reference puts it beside the CTA. Real figures. */
  rating: { score: "4.7", count: "40 reviews" },
  /**
   * The bento cluster. Every tile states something the client gets, with a
   * figure that is actually true - a delivered performance fix, the real
   * Upwork record, a real cost outcome. No photography: the only real photo
   * is of the founder, and the hero is not about him.
   */
  bento: {
    /** A result actually delivered, not a biography line. */
    result: {
      eyebrow: "Performance",
      from: "900",
      to: "6",
      caption: "queries on one invoice list",
    },
    proof: {
      value: "100%",
      label: "job success",
      note: "49 projects delivered",
    },
    cost: {
      eyebrow: "Cloud cost",
      title: "Bill down, features intact",
      note: "nothing cut to get there",
    },
    code: {
      file: "reliability.ts",
      lines: [
        "// keep the job alive,",
        "// not the incident",
        "tries: 5,",
        "backoff: [10, 30, 90],",
        "onFail: page(\"oncall\"),",
      ],
    },
  },
  primaryCta: site.primaryCta,
  secondaryCta: { label: "View Portfolio", href: "/portfolio" },
  logosCaption: "Powering solutions with",
  techLogos: [
    { icon: "logos:laravel", label: "Laravel" },
    { icon: "logos:nodejs-icon", label: "Node.js" },
    { icon: "logos:nextjs-icon", label: "Next.js" },
    { icon: "logos:vue", label: "Vue" },
    { icon: "logos:aws", label: "AWS" },
  ],
  moreLogos: [
    { icon: "logos:postgresql", label: "PostgreSQL" },
    { icon: "logos:docker-icon", label: "Docker" },
  ],
  dashboard: {
    url: "upwork.com/freelancers",
    kicker: "Upwork",
    title: "Track record",
    stats: [
      { label: "Job Success", value: "100", unit: "%" },
      { label: "Hours", value: "2,600", unit: "+" },
      { label: "Jobs", value: "49", unit: "" },
    ],
    requests: "Top Rated Plus · $50K+ earned",
    representative: false,
  },
  scrollHref: "#workflow",
} as const;
