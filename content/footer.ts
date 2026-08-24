import { site } from "./site";

export const footer = {
  tagline:
    "Senior full-stack engineer - Laravel, Node, Next.js & Vue. Top Rated Plus on Upwork, 8+ years.",
  columns: [
    {
      title: "SERVICES",
      links: [
        { label: "SaaS & Web Apps",       href: "/services" },
        { label: "Laravel & Node APIs",   href: "/services" },
        { label: "Next.js / Vue Frontends", href: "/services" },
        { label: "Cloud & DevOps (AWS)",  href: "/services" },
        { label: "E-commerce",            href: "/services" },
        { label: "AI Automation",         href: "/services" },
        { label: "Rescue & Migrations",   href: "/services" },
      ],
    },
    {
      title: "COMPANY",
      links: [
        { label: "About",           href: "/about" },
        { label: "Portfolio",       href: "/portfolio" },
        { label: "Results",         href: "/testimonials" },
        { label: "Schedule a Call", href: "/schedule" },
      ],
    },
    {
      title: "RESOURCES",
      links: [
        { label: "Blog",         href: "/blog" },
        { label: "All services", href: "/services" },
        { label: "Privacy",      href: "/privacy" },
        { label: "Terms",        href: "/terms" },
        { label: "Cookies",      href: "/cookies" },
      ],
    },
    {
      title: "CONTACT",
      links: [
        { label: "Contact form",    href: "/contact" },
        { label: "Email",           href: `mailto:${site.contact.email}`, external: false },
        { label: "Upwork",          href: site.contact.upwork, external: true },
        { label: "LinkedIn",        href: site.contact.linkedin, external: true },
        { label: "Schedule a Call", href: "/schedule" },
      ],
    },
  ],
  legal: "© 2026 Ali Raza · Twixr Solutions. All rights reserved.",
  note: "Shipped with care · Top Rated Plus",
  legalLinks: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookies", href: "/cookies" },
  ],
} as const;