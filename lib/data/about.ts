import { site } from "@/content/site";

export const aboutBio = {
  name: site.name,
  title: site.role,
  subtitle: "Building scalable SaaS, e-commerce, and APIs for global clients.",
  image: "/ali-raza.jpg",
  upworkProfile: site.contact.upwork,
  githubProfile: site.contact.github,
  upworkProof: "/upwork-top-rated-plus.png",
  paragraphs: [
    `I'm a Senior Full-Stack Engineer with ${site.yearsExperience} years of experience shipping production web applications, SaaS platforms, and APIs. As Founder & Full-Stack Engineer at ${site.brand}, I partner with startups and established teams to turn complex requirements into reliable, maintainable software.`,
    "My stack centers on Laravel, Node, Next.js, and Vue - backed by cloud infrastructure on AWS. I'm Top Rated Plus on Upwork with a focus on long-term client relationships, clear communication, and delivery that scales beyond the first launch.",
  ],
  location: "Lahore, Pakistan · Remote worldwide",
  email: site.contact.email,
};

export const aboutHighlights = [
  "Full-stack SaaS & web application development",
  "Laravel & Node APIs, multi-tenant architecture",
  "Next.js and Vue frontends",
  "Cloud infrastructure & CI/CD on AWS",
  "E-commerce, payments, rescue & migrations",
  "AI automation where it adds real value",
] as const;
