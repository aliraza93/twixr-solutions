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
    title: "Full-Stack Developer & DevOps Engineer",
    company: "LeadQuiz",
    start: "2025-12",
    end: null,
    present: true,
    period: "2025 - Present",
    location: "United States · Remote",
    country: "United States",
    desc: "Full-stack SaaS lead-funnel platform for agencies on AWS microservices (ECS, RDS/PostgreSQL, S3) - drag-and-drop funnel builder with 30+ templates, custom domains, conditional lead scoring, multi-client management, and scheduled reporting.",
    tech: ["NestJS", "React", "PostgreSQL", "Docker", "AWS"],
    highlights: ["Microservices on AWS", "Funnel builder (30+ templates)", "Zapier & webhook integrations"],
    href: "#",
    logo: "logos:nestjs",
    categories: ["SaaS", "DevOps"],
    projects: [],
  },
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
    title: "Full-Stack Developer",
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
    title: "Senior Backend Laravel Developer",
    company: "Applis Technologies",
    start: "2021-03",
    end: "2023-06",
    present: false,
    period: "2021 - 2023",
    location: "United States · Remote",
    country: "United States",
    desc: "Built and maintained Vue.js + Laravel dashboards and deployed them on AWS - CodePipeline CI/CD, Elastic Beanstalk, RDS, CloudFront, and S3 for secure, scalable hosting.",
    tech: ["Laravel", "Vue", "MySQL", "AWS"],
    highlights: ["Vue + Laravel dashboards", "AWS CodePipeline CI/CD", "Elastic Beanstalk & RDS"],
    href: "#",
    logo: "logos:laravel",
    categories: ["SaaS", "DevOps"],
    projects: [],
  },
  {
    title: "Software Engineer",
    company: "Mskn | مسكن",
    start: "2021-10",
    end: "2022-03",
    present: false,
    period: "2021 - 2022",
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
    title: "Sr. Software Developer",
    company: "UNIAL Solutions",
    start: "2020-11",
    end: "2021-05",
    present: false,
    period: "2020 - 2021",
    location: "Faisalabad, Pakistan",
    country: "Pakistan",
    desc: "Full-stack PHP/Laravel development - building and maintaining web applications and APIs for business clients.",
    tech: ["PHP", "Laravel", "MySQL"],
    highlights: ["Web apps", "APIs", "Maintenance"],
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
