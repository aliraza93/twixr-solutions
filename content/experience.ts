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
  period: "2017 – 2021",
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
    period: "2023 – Present",
    location: "Pakistan",
    country: "Pakistan",
    desc: "Building SaaS, e-commerce, and API products for global clients — end-to-end architecture, delivery, and DevOps.",
    tech: ["Next.js", "Node.js", "Laravel", "AWS"],
    highlights: ["Multi-tenant SaaS", "Payment platforms", "Rescue & migrations"],
    href: "https://www.twixrsolutions.com",
    logo: "logos:nextjs-icon",
    categories: ["SaaS", "Websites", "APIs"],
    projects: [
      { title: "LeadQuiz", image: "/projects/upalerts-1.png" },
      { title: "ManagePH", image: "/projects/upalerts-2.png" },
      { title: "OSRS Gaming", image: "/projects/upalerts-3.png" },
    ],
  },
  {
    title: "Full-Stack Engineer · Top Rated Plus",
    company: "Upwork (Freelance)",
    start: "2019-01",
    end: null,
    present: true,
    period: "2019 – Present",
    location: "Remote",
    country: null,
    desc: `Top 3% talent with ${jobSuccess} Job Success across ${jobs} jobs and ${hours} hours — Laravel, Node, Next.js & Vue with AWS DevOps.`,
    tech: ["Laravel", "Vue", "Node.js", "PostgreSQL"],
    highlights: ["LeadQuiz", "ManagePH", "E-commerce platforms"],
    href: site.contact.upwork,
    logo: "simple-icons:upwork",
    categories: ["Freelance", "SaaS"],
    projects: [],
  },
  {
    title: "Senior Full Stack Developer",
    company: "DevLabs",
    start: "2020-01",
    end: "2022-12",
    present: false,
    period: "2020 – 2022",
    location: "Remote",
    country: null,
    desc: "Built and maintained full-stack web apps with Laravel and React; optimized database performance and search.",
    tech: ["React", "Laravel", "PostgreSQL", "Redis"],
    highlights: ["Web apps", "E-commerce", "APIs"],
    href: "#",
    logo: "logos:laravel",
    categories: ["Websites", "E-commerce"],
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
