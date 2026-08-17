import { site } from "./site";

export const footer = {
  tagline: `${site.primaryTitle} — Freelancing, Programming & AI. Top Rated Plus on Upwork with ${site.yearsOfExperience}+ years of experience.`,
  legal: "All rights reserved.",
  shipped: "Shipped with care · Top Rated Plus",
  columns: [
    {
      label: "Services",
      links: [
        { name: "SaaS & Web Apps", href: "/services/saas-web-app-development" },
        { name: "Laravel API", href: "/services/laravel-api-backend" },
        { name: "Next.js Frontend", href: "/services/nextjs-frontend" },
        { name: "AI Automation", href: "/services/ai-automation-chatbots" },
        { name: "Cloud & DevOps", href: "/services/cloud-infrastructure-devops" },
        { name: "Mobile Apps", href: "/services/mobile-app-development" },
      ],
    },
    {
      label: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Portfolio", href: "/portfolio" },
        { name: "Results", href: "/testimonials" },
        { name: "Schedule a Call", href: site.bookingHref },
      ],
    },
    {
      label: "Resources",
      links: [
        { name: "Blog", href: "/blog" },
        { name: "Trainings", href: "/courses" },
        { name: "All services", href: "/services" },
        { name: "Newsletter", href: "#newsletter" },
      ],
    },
    {
      label: "Contact",
      links: [
        { name: "Email", href: `mailto:${site.email}` },
        { name: "Upwork", href: site.upworkHref },
        { name: "Fiverr", href: site.fiverrHref },
        { name: "Schedule a Call", href: site.bookingHref },
      ],
    },
  ],
  socials: [
    { name: "YouTube", icon: "logos:youtube-icon", href: "#" },
    { name: "LinkedIn", icon: "logos:linkedin-icon", href: site.linkedinHref },
    { name: "Facebook", icon: "logos:facebook", href: "#" },
    { name: "Instagram", icon: "logos:instagram-icon", href: "#" },
    { name: "X", icon: "logos:twitter", href: "#" },
    { name: "TikTok", icon: "logos:tiktok-icon", href: "#" },
  ],
  platforms: [
    { name: "YouTube Channel", href: "#" },
    { name: "Official Website", href: site.url },
    { name: "Trainings", href: "/courses" },
    { name: "Newsletter", href: "#newsletter" },
    { name: "Schedule Meeting", href: site.bookingHref },
  ],
  freelance: [
    { name: "Upwork", href: site.upworkHref },
    { name: "Fiverr", href: site.fiverrHref },
  ],
  community: [
    { name: "Facebook Group", href: "#" },
    { name: "WhatsApp Channel", href: "#" },
    { name: "Skool Community", href: "#" },
  ],
} as const;

/** Legacy shape for about-page-client. */
export const footerData = {
  platforms: footer.platforms,
  freelance: footer.freelance,
  community: footer.community,
  socials: footer.socials,
};
