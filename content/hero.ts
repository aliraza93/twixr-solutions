import { site } from "./site";

export const hero = {
  eyebrow: "Full-stack engineering · Cloud · AI",
  stableHeading: "Build Scalable, Secure Web Apps with a Top 3% Developer",
  rotatingWords: ["Secure", "Fast", "Reliable", "AI-Powered", "Scalable"] as const,
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
    [{ text: "Developer", kind: "emphasis" as const }],
  ],
  subheading: `Senior Full Stack Engineer (${site.yearsOfExperience}+ Years) specializing in Laravel, Next.js, and Cloud Infrastructure. ${site.valueProp}`,
  primaryCta: site.ctas.start,
  secondaryCta: site.ctas.portfolio,
  logosCaption: "Powering solutions with",
  techLogos: [
    { icon: "logos:laravel", label: "Laravel" },
    { icon: "logos:nodejs-icon", label: "Node.js" },
    { icon: "logos:aws", label: "AWS" },
    { icon: "logos:react", label: "React" },
    { icon: "logos:vue", label: "Vue" },
  ],
  moreLogos: [
    { icon: "logos:wordpress-icon", label: "WordPress" },
    { icon: "logos:docker-icon", label: "DevOps" },
    { icon: "logos:nextjs-icon", label: "Next.js" },
  ],
  dashboard: {
    url: "app.twixrsolutions.com/ops",
    kicker: "Production",
    title: "Delivery dashboard",
    stats: [
      { label: "Uptime", value: "99.99", unit: "%" },
      { label: "Latency", value: "42", unit: "ms" },
      { label: "Deploys", value: "12", unit: "" },
    ],
    requests: "2.4M · +12%",
    representative: true,
  },
  scrollHref: "#workflow",
} as const;
