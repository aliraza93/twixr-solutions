export const site = {
  name: "Ali Raza",
  brand: "Twixr Solutions",
  brandShort: "Twixr",
  url: "https://twixrsolutions.com",
  primaryTitle: "Senior Full Stack Engineer & Founder",
  /** Single source of truth — used in hero, FAQ, footer, metadata, career stats. */
  yearsOfExperience: 10,
  valueProp:
    "I transform complex technical challenges into high-performance solutions.",
  email: "ali@twixrsolutions.com",
  bookingHref: "/schedule",
  cvHref: "mailto:ali@twixrsolutions.com?subject=CV%20request",
  upworkHref: "https://www.upwork.com",
  fiverrHref: "https://www.fiverr.com",
  linkedinHref: "#",
  githubHref: "#",
  markets: ["Pakistan", "UAE", "Remote"] as const,
  proof: {
    topRatedPlus: true,
    jobSuccess: "100%",
  },
  nav: [
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/blog", label: "Blog" },
    { href: "/testimonials", label: "Results" },
  ] as const,
  ctas: {
    start: { label: "Start a Project", href: "/schedule" },
    schedule: { label: "Schedule a Call", href: "/schedule" },
    portfolio: { label: "View Portfolio", href: "/portfolio" },
  },
} as const;

export type Site = typeof site;
