export const site = {
  name: "Twixr Solutions",
  brand: "Twixr Solutions",
  brandShort: "Twixr",
  url: "https://twixrsolutions.com",
  primaryTitle: "Senior Full-Stack Engineer",
  /** Single source of truth — used in hero, FAQ, footer, metadata, career stats. */
  yearsOfExperience: 8,
  valueProp:
    "Senior full-stack engineer building SaaS, e-commerce, and APIs that scale — Laravel, Node, Next.js & Vue on AWS. AI automation when it adds real value.",
  email: "ali@twixrsolutions.com",
  bookingHref: "/schedule",
  cvHref: "/ali-raza-cv.pdf",
  upworkHref: "https://www.upwork.com/freelancers/~01e1dd4667ee1975e6",
  fiverrHref: "https://www.fiverr.com",
  linkedinHref: "#",
  githubHref: "#",
  markets: ["Pakistan", "UAE", "Remote"] as const,
  proof: {
    topRatedPlus: true,
    jobSuccess: "100%",
    earned: "$50K+",
    jobs: "48",
    hours: "2,588",
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
