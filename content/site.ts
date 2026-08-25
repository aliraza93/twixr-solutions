export const site = {
  name: "Ali Raza",
  brand: "Twixr Solutions",
  role: "Senior Full-Stack Engineer",
  tagline:
    "Senior full-stack engineer building SaaS, e-commerce, and APIs that scale - Laravel, Node, Next.js & Vue on AWS. AI automation when it adds real value.",
  yearsExperience: "8+",

  proof: [
    { label: "Job Success", value: "100%" },
    { label: "Upwork", value: "Top Rated Plus" }, // Top 3% of talent
    { label: "Earned on Upwork", value: "$50K+" },
    { label: "Jobs", value: "49" },
    { label: "Hours", value: "2,600+" },
    { label: "Rating", value: "4.7★ (40)" },
    { label: "Experience", value: "8+ yrs" },
  ],

  // Raw values - single source of truth.
  contact: {
    email: "aliraza.2369196@gmail.com",
    upwork: "https://www.upwork.com/freelancers/~01e1dd4667ee1975e6",
    fiverr: "", // no public Fiverr profile - left blank so SEO/sameAs skips it
    linkedin: "https://www.linkedin.com/in/aliraza6332",
    github: "https://github.com/aliraza93",
    booking: "https://cal.com/ali-raza-2haylj/30min",
  },

  responseTime: "Replies within ~30 min",

  // Ready-to-map list for the Contact page left column + footer contact links.
  // `external: true` → open in a new tab with rel="noopener noreferrer".
  contactMethods: [
    { key: "email",    label: "Email",       value: "aliraza.2369196@gmail.com", href: "mailto:aliraza.2369196@gmail.com", external: false },
    { key: "upwork",   label: "Upwork",      value: "Top Rated Plus",            href: "https://www.upwork.com/freelancers/~01e1dd4667ee1975e6", external: true },
    { key: "github",   label: "GitHub",      value: "github.com/aliraza93",      href: "https://github.com/aliraza93", external: true },
    { key: "linkedin", label: "LinkedIn",    value: "in/aliraza6332",            href: "https://www.linkedin.com/in/aliraza6332", external: true },
    { key: "booking",  label: "Book a call", value: "Cal.com",                   href: "https://cal.com/ali-raza-2haylj/30min", external: true },
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
