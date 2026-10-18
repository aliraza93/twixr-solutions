import { site } from "./site";

const jobs = site.proof.find((item) => item.label === "Jobs")?.value ?? "";
const earned = site.proof.find((item) => item.label === "Earned on Upwork")?.value ?? "";
const jobSuccess = site.proof.find((item) => item.label === "Job Success")?.value ?? "";
const hours = site.proof.find((item) => item.label === "Hours")?.value ?? "";

export const career = {
  eyebrow: "Professional Path",
  heading: "Career",
  emphasis: "Evolution",
  lead: "From engineering roles to technical leadership and full-stack expertise.",
  cvLabel: "Download CV",
  cvHref: "/ali-raza-cv.pdf",
} as const;

export const experienceStats = [
  { value: site.yearsExperience, unit: "YEARS" },
  { value: jobs, unit: "JOBS" },
  { value: earned, unit: "EARNED" },
  { value: jobSuccess, unit: "JOB SUCCESS" },
] as const;

export const education = {
  degree: "BS, Software Engineering",
  school: "Government College University, Faisalabad",
  period: "2017 - 2021",
} as const;

export type ExperienceRole = {
  title: string;
  company: string;
  start: string;
  end: string | null;
  present: boolean;
  period: string;
  location: string;
  country: string | null;
  desc: string;
  tech: string[];
  highlights: string[];
  href: string;
  logo: string;
  categories: string[];
  projects: { title: string; image: string }[];
};

export const experienceRoles: ExperienceRole[] = [
  {
    title: "Full-Stack Developer · Top Rated Plus",
    company: "Upwork (Freelance)",
    start: "2020-01",
    end: null,
    present: true,
    period: "2020 - Present",
    location: "Remote",
    country: null,
    desc: `Top 3% talent with ${jobSuccess} Job Success across ${jobs} jobs and ${hours} hours - Laravel, Node, Next.js & Vue with AWS DevOps for clients in the US, UK, Oman, and beyond.`,
    tech: ["Laravel", "Vue", "Node.js", "PostgreSQL"],
    highlights: ["49 jobs, 100% JSS", "$50K+ earned", "Repeat clients for 2 - 4 years"],
    href: site.contact.upwork,
    logo: "simple-icons:upwork",
    categories: ["Freelance", "SaaS"],
    projects: [],
  },
  {
    title: "Full-Stack Developer & DevOps",
    company: "LuckyCharmGold",
    start: "2026-01",
    end: null,
    present: true,
    period: "2026 - Present",
    location: "Remote",
    country: null,
    desc: "Laravel 12 and Vue 3 commerce platform for OSRS gold, accounts and services - a custom checkout over 9 payment integrations, MaxMind fraud screening, server-side GA4 and Google Ads tracking, and GitHub Actions + Deployer releases across dev, staging and production with automatic rollback.",
    tech: ["Laravel", "Vue", "MySQL", "Redis", "Cloudflare"],
    highlights: ["9 payment integrations", "Zero-downtime CI/CD, 3 environments", "Fraud screening & conversion tracking"],
    href: "https://luckycharmgold.com",
    logo: "logos:laravel",
    categories: ["E-commerce", "DevOps"],
    projects: [],
  },
  {
    title: "Founder & Full-Stack Engineer",
    company: "Twixr Solutions",
    start: "2023-01",
    end: null,
    present: true,
    period: "2023 - Present",
    location: "Lahore, Pakistan · Remote",
    country: "Pakistan",
    desc: "Building SaaS, e-commerce, and API products for founders and CTOs worldwide - end-to-end architecture, delivery, and DevOps on AWS.",
    tech: ["Next.js", "NestJS", "Laravel", "AWS"],
    highlights: ["Multi-tenant SaaS", "Payment platforms", "Rescue & migrations"],
    href: "https://www.twixrsolutions.com",
    logo: "logos:nextjs-icon",
    categories: ["SaaS", "APIs", "DevOps"],
    projects: [],
  },
  {
    title: "Full-Stack PHP Laravel Developer",
    company: "Local Spark Solutions",
    start: "2024-07",
    end: "2024-07",
    present: false,
    period: "2024",
    location: "Remote",
    country: null,
    desc: "Performance work across a Laravel application, Tailwind pages with real-time validation, and a Gemini API integration with tuned prompts for generating unique content.",
    tech: ["Laravel", "Tailwind", "Gemini API"],
    highlights: ["Gemini content generation", "Performance tuning", "Tailwind UI"],
    href: "#",
    logo: "logos:laravel",
    categories: ["AI", "Websites"],
    projects: [],
  },
  {
    title: "Senior PHP Laravel Developer",
    company: "PropDaddy.com",
    start: "2023-09",
    end: "2024-01",
    present: false,
    period: "2023 - 2024",
    location: "United States · Remote",
    country: "United States",
    desc: "Real-estate web platform: query optimization, cron-driven automation, an in-app Twilio softphone, and multi-channel campaign management (SendGrid, IMAP, Slybroadcast, Twilio) with VPS queue workers.",
    tech: ["Laravel", "Twilio", "MySQL", "AWS"],
    highlights: ["Twilio softphone", "Campaign automation", "Queue workers & skip tracing"],
    href: "#",
    logo: "logos:laravel",
    categories: ["Websites", "APIs"],
    projects: [],
  },
  {
    title: "Full-Stack Developer",
    company: "Applis LLC",
    start: "2022-03",
    end: "2023-06",
    present: false,
    period: "2022 - 2023",
    location: "United States · Remote",
    country: "United States",
    desc: "Led Laravel backend development and built Vue.js + Laravel dashboards, deployed on AWS with CI/CD pipelines, CloudFront, S3 and EC2, plus Pusher real-time features and Twilio OTP authentication.",
    tech: ["Laravel", "Vue", "MySQL", "AWS"],
    highlights: ["Vue + Laravel dashboards", "AWS CI/CD", "Real-time & OTP auth"],
    href: "#",
    logo: "logos:laravel",
    categories: ["SaaS", "DevOps"],
    projects: [],
  },
  {
    title: "Full-Stack Web Developer",
    company: "Mskn | مسكن",
    start: "2021-09",
    end: "2021-12",
    present: false,
    period: "2021",
    location: "Muscat, Oman · Remote",
    country: "Oman",
    desc: "Full-stack development across backend and frontend - modified existing systems to add features, debugged by priority, and shipped performance improvements for a property platform.",
    tech: ["PHP", "Laravel", "MySQL", "JavaScript"],
    highlights: ["Backend + frontend", "Performance tuning", "Feature delivery"],
    href: "#",
    logo: "logos:php",
    categories: ["Websites"],
    projects: [],
  },
  {
    title: "Full-Stack Laravel & Vue Developer",
    company: "Compu Solutions USA",
    start: "2021-02",
    end: "2021-03",
    present: false,
    period: "2021",
    location: "United States · Remote",
    country: "United States",
    desc: "Built a query builder feature end to end in Laravel and Vue.",
    tech: ["Laravel", "Vue"],
    highlights: ["Query builder", "Laravel + Vue"],
    href: "#",
    logo: "logos:vue",
    categories: ["Websites"],
    projects: [],
  },
  {
    title: "WordPress Plugin Developer",
    company: "Skunk.tech",
    start: "2021-01",
    end: "2021-02",
    present: false,
    period: "2021",
    location: "Remote",
    country: null,
    desc: "Premium custom WordPress plugin development.",
    tech: ["WordPress", "PHP"],
    highlights: ["Custom plugin"],
    href: "#",
    logo: "logos:wordpress-icon",
    categories: ["Websites"],
    projects: [],
  },
  {
    title: "Full-Stack Laravel, Vue & React Developer",
    company: "UNIAL Solutions",
    start: "2020-08",
    end: "2021-03",
    present: false,
    period: "2020 - 2021",
    location: "Faisalabad, Pakistan",
    country: "Pakistan",
    desc: "Full-stack PHP/Laravel development with Vue and React frontends - building and maintaining web applications and APIs for business clients, with Git-based team workflows.",
    tech: ["PHP", "Laravel", "Vue", "React"],
    highlights: ["Web apps", "APIs", "Git workflows"],
    href: "#",
    logo: "logos:php",
    categories: ["Websites", "APIs"],
    projects: [],
  },
];

export function experienceStatLine() {
  return experienceStats.map((s) => `${s.value} ${s.unit}`).join(" · ");
}

/** Shape used by existing section components (role/period/link aliases). */
export const experiences = experienceRoles.map((role) => ({
  company: role.company,
  location: role.location,
  role: role.title,
  period: role.period,
  description: role.desc,
  categories: role.categories,
  technologies: role.tech,
  logo: role.logo,
  link: role.href,
  highlights: role.highlights,
  projects: role.projects,
}));
