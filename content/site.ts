export const site = {
  name: "Ali Raza",
  brand: "Twixr Solutions",
  role: "Senior Full-Stack Engineer",
  tagline:
    "Senior full-stack engineer building SaaS, e-commerce, and APIs that scale — Laravel, Node, Next.js & Vue on AWS. AI automation when it adds real value.",
  yearsExperience: "8+",

  proof: [
    { label: "Job Success", value: "100%" },
    { label: "Upwork", value: "Top Rated Plus" }, // Top 3% of talent
    { label: "Earned on Upwork", value: "$50K+" },
    { label: "Jobs", value: "48" },
    { label: "Hours", value: "2600+" },
    { label: "Experience", value: "8+ yrs" },
  ],

  // Raw values — single source of truth. REPLACE the placeholders.
  contact: {
    email: "REPLACE_ME@twixrsolutions.com",
    upwork: "https://www.upwork.com/freelancers/~01e1dd4667ee1975e6",
    fiverr: "https://www.fiverr.com/REPLACE_ME",
    linkedin: "https://www.linkedin.com/in/REPLACE_ME",
    booking: "https://cal.com/REPLACE_ME",
  },

  responseTime: "Replies within ~30 min",

  // Ready-to-map list for the Contact page left column + footer contact links.
  // `external: true` → open in a new tab with rel="noopener noreferrer".
  contactMethods: [
    { key: "email",   label: "Email",    value: "REPLACE_ME@twixrsolutions.com", href: "mailto:REPLACE_ME@twixrsolutions.com", external: false },
    { key: "upwork",  label: "Upwork",   value: "Top Rated Plus",                 href: "https://www.upwork.com/freelancers/~01e1dd4667ee1975e6", external: true },
    { key: "fiverr",  label: "Fiverr",   value: "@REPLACE_ME",                    href: "https://www.fiverr.com/REPLACE_ME", external: true },
    { key: "booking", label: "Book a call", value: "Cal.com",                     href: "https://cal.com/REPLACE_ME", external: true },
  ],

  // Primary nav button (was pointing at #contact).
  primaryCta: { label: "Start a Project", href: "/contact" },

  // Structured nav so hrefs are explicit (Results → /testimonials, etc.)
  // and Contact is a real destination.
  nav: [
    { label: "About",     href: "/about" },
    { label: "Services",  href: "/services" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Blog",      href: "/blog" },
    { label: "Results",   href: "/testimonials" },
    { label: "Contact",   href: "/contact" },
  ],
} as const;

export type Site = typeof site;
