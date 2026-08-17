import { site } from "./site";

export const career = {
  eyebrow: "Professional Path",
  heading: "Career",
  emphasis: "Evolution",
  lead: "A timeline of my professional growth, from early engineering roles to technical leadership and full-stack expertise.",
  cvLabel: "Download CV",
  cvHref: site.cvHref,
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
    title: "Founder & Lead Engineer",
    company: "Twixr Solutions",
    start: "2023-01",
    end: null,
    present: true,
    period: "January 2023 - Present",
    location: "Pakistan",
    country: "Pakistan",
    desc: "Leading Twixr Solutions, a premium digital agency specializing in high-performance web applications and AI-driven automation. I manage end-to-end delivery of complex projects for global clients.",
    tech: ["Next.js", "Node.js", "Laravel", "OpenAI", "AWS"],
    highlights: [
      "AI Proposal Engine",
      "Custom SaaS Platform",
      "Enterprise Dashboard",
    ],
    href: "https://twixrsolutions.com",
    logo: "logos:nextjs-icon",
    categories: ["AI", "Websites", "Automation"],
    projects: [
      { title: "AI Proposal Engine", image: "/projects/upalerts-1.png" },
      { title: "Custom SaaS Platform", image: "/projects/upalerts-2.png" },
      { title: "Enterprise Dashboard", image: "/projects/upalerts-3.png" },
    ],
  },
  {
    title: "Senior Full Stack Developer",
    company: "DevLabs",
    start: "2020-01",
    end: "2022-12",
    present: false,
    period: "January 2020 - December 2022",
    location: "Remote",
    country: null,
    desc: "Developed and maintained full-stack web applications using Laravel and React. Optimized database performance and implemented advanced search features.",
    tech: ["React", "Laravel", "PostgreSQL", "Redis"],
    highlights: ["Websites", "E-commerce", "PostgreSQL"],
    href: "#",
    logo: "logos:laravel",
    categories: ["Websites", "E-commerce"],
    projects: [],
  },
  {
    title: "Jr Software Engineer",
    company: "Smonte Technologies",
    start: "2014-01",
    end: "2014-08",
    present: false,
    period: "January 2014 - August 2014 (7 months)",
    location: "Lahore",
    country: "Pakistan",
    desc: "Gained valuable experience working on software development projects. Collaborated with experienced team members in delivering quality solutions.",
    tech: ["PHP", "MySQL", "JavaScript", "HTML/CSS"],
    highlights: ["Websites", "PHP", "MySQL"],
    href: "#",
    logo: "logos:php",
    categories: ["Websites"],
    projects: [],
  },
  {
    title: "Android Trainer",
    company: "Reliance College",
    start: "2013-10",
    end: "2013-12",
    present: false,
    period: "October 2013 - December 2013 (2 months)",
    location: "Faisalabad",
    country: "Pakistan",
    desc: "Provided Android Application Development Training to a class of 10 students. Taught mobile development fundamentals and best practices.",
    tech: ["Android", "Java", "Mobile Development"],
    highlights: ["Trainings", "Mobile Apps", "Android"],
    href: "#",
    logo: "logos:android-icon",
    categories: ["Trainings", "Mobile Apps"],
    projects: [],
  },
  {
    title: "Intern Android Developer",
    company: "Beacon Impex (Pvt) Ltd",
    start: "2013-07",
    end: "2013-10",
    present: false,
    period: "July 2013 - October 2013 (3 months)",
    location: "Faisalabad",
    country: "Pakistan",
    desc: "Android Database Development using SQLite, Android UI Design, Social Networking Integration with Android Apps.",
    tech: ["Android", "SQLite", "Java", "Social Media Integration"],
    highlights: ["Mobile Apps", "Android", "SQLite"],
    href: "#",
    logo: "logos:android-icon",
    categories: ["Mobile Apps"],
    projects: [],
  },
];

export function experienceStatLine(roles: ExperienceRole[] = experienceRoles) {
  const years = `${site.yearsOfExperience}+ YEARS`;
  const count = `${roles.length} ROLES`;
  const n = site.markets.length;
  const places = `${n} COUNTRIES`;
  return `${years} · ${count} · ${places}`;
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
