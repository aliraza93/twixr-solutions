import { site } from "./site";

export const hero = {
  eyebrow: "Full-stack engineering · SaaS · Cloud & DevOps",
  stableHeading: "Build Scalable, Reliable Web Apps with a Top 3% Engineer",
  rotatingWords: ["Reliable", "Secure", "Fast", "Scalable", "Maintainable"] as const,
  headingLines: [
    [
      { text: "Build", kind: "plain" as const },
      { text: "Scalable,", kind: "plain" as const },
    ],
    [
      { kind: "cycle" as const },
      { text: "Web", kind: "plain" as const },
      { text: "Apps", kind: "plain" as const },
    ],
    [
      { text: "with", kind: "plain" as const },
      { text: "a", kind: "plain" as const },
      { text: "Top", kind: "emphasis" as const },
      { text: "3%", kind: "emphasis" as const },
    ],
    [{ text: "Engineer", kind: "emphasis" as const }],
  ],
  subheading: `Senior full-stack engineer (${site.yearsExperience} years) specializing in Laravel, Node.js, Next.js & Vue, multi-tenant SaaS, and cloud/DevOps on AWS. I turn complex technical challenges into products that ship and scale - with AI automation when it adds real value.`,
  proofChip: "Top Rated Plus · 100% Job Success · 4.7★ across 40 reviews",
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
