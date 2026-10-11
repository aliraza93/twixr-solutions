import { site } from "./site";

export const hero = {
  eyebrow: "Full-stack engineering · SaaS · Cloud & DevOps",
  stableHeading: "Shipping is the easy part. Staying up is mine.",
  // Kept for type compatibility with stored CMS rows; the hero no longer
  // cycles a word - a statement with a full stop outperforms a slot machine.
  rotatingWords: [] as const,
  // One logical line; the heading finds its own rag from the measure.
  // Edit this from /admin/content/site as plain text with **emphasis**.
  headingLines: [
    [
      { text: "Shipping", kind: "plain" as const },
      { text: "is", kind: "plain" as const },
      { text: "the", kind: "plain" as const },
      { text: "easy", kind: "plain" as const },
      { text: "part.", kind: "plain" as const },
      { text: "Staying", kind: "emphasis" as const },
      { text: "up", kind: "emphasis" as const },
      { text: "is", kind: "emphasis" as const },
      { text: "mine.", kind: "emphasis" as const },
    ],
  ],
  subheading: `Senior full-stack engineer, ${site.yearsExperience} years in. I build multi-tenant SaaS on Laravel, Node.js, Next.js and AWS - then keep it fast, up, and cheap to run.`,
  proofChip: "Top Rated Plus · 100% Job Success · 4.7★ across 40 reviews",
  /** The ledger across the bottom of the fold. Real Upwork figures, at a size
   *  a visitor can actually read - they were previously ~11px inside a mock. */
  stats: [
    { label: "Job success", value: "100", unit: "%" },
    { label: "Hours delivered", value: "2,600", unit: "+" },
    { label: "Jobs shipped", value: "49", unit: "" },
    { label: "Years in", value: "8", unit: "+" },
  ],
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
