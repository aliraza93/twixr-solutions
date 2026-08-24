export type StatusCode = "404" | "500" | "503" | "403" | "401";

export type StatusIcon = "search" | "map" | "home" | "server" | "alert" | "wrench" | "hammer" | "cloud" | "rocket" | "lock" | "key" | "shield" | "user" | "log-in";

export type StatusPageContent = {
  code: StatusCode;
  eyebrow: string;
  headingLine1: string;
  headingLine2: string;
  tiles: readonly [
    { label: string; icon: StatusIcon },
    { label: string; icon: StatusIcon },
    { label: string; icon: StatusIcon },
  ];
  missionMuted: string;
  missionEmphasis: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  ctaTitle: string;
  ctaEmphasis: string;
  ctaDescription: string;
  description: string;
};

export const statusPages = {
  notFound: {
    code: "404",
    eyebrow: "404 · Not found",
    headingLine1: "This path isn't",
    headingLine2: "on the map.",
    tiles: [
      { label: "Request", icon: "search" },
      { label: "This route", icon: "map" },
      { label: "Home", icon: "home" },
    ],
    missionMuted: "The URL doesn't match anything I ship. ",
    missionEmphasis:
      "Head home, browse the work, or tell me what you were looking for.",
    primary: { label: "Back to home", href: "/" },
    secondary: { label: "View work", href: "/portfolio" },
    ctaTitle: "Looking for a project partner?",
    ctaEmphasis: "partner",
    ctaDescription:
      "If you landed here while scoping a build, skip the detour - start a project and I'll reply.",
    description:
      "That page doesn't exist on Twixr Solutions. Return home or browse the portfolio.",
  },
  serverError: {
    code: "500",
    eyebrow: "500 · Server error",
    headingLine1: "The server hit",
    headingLine2: "a snag.",
    tiles: [
      { label: "Request", icon: "server" },
      { label: "Fault", icon: "alert" },
      { label: "Retry", icon: "wrench" },
    ],
    missionMuted: "That's on my side, not yours. ",
    missionEmphasis:
      "Try again in a moment, or email me with the error code if it sticks.",
    primary: { label: "Try again", href: "/" },
    secondary: { label: "Contact", href: "/contact" },
    ctaTitle: "Need a human instead?",
    ctaEmphasis: "human",
    ctaDescription:
      "If a page keeps failing, send a note - I'll trace it and get you unblocked.",
    description:
      "Something broke while rendering this page. Retry, or contact Twixr Solutions.",
  },
  maintenance: {
    code: "503",
    eyebrow: "503 · Maintenance",
    headingLine1: "Shipping a",
    headingLine2: "better version.",
    tiles: [
      { label: "Build", icon: "hammer" },
      { label: "Deploy", icon: "cloud" },
      { label: "Back soon", icon: "rocket" },
    ],
    missionMuted: "The site is briefly offline for a deploy. ",
    missionEmphasis:
      "I should be back shortly - email or book a call if you need me now.",
    primary: { label: "Book a call", href: "/schedule" },
    secondary: { label: "Email me", href: "/contact" },
    ctaTitle: "Still want to start a project?",
    ctaEmphasis: "project",
    ctaDescription:
      "Maintenance doesn't pause the inbox. Send the brief and I'll pick it up as soon as this ships.",
    description:
      "Twixr Solutions is down for a short deploy. Check back shortly or get in touch.",
  },
  forbidden: {
    code: "403",
    eyebrow: "403 · Forbidden",
    headingLine1: "This door",
    headingLine2: "stays closed.",
    tiles: [
      { label: "Request", icon: "lock" },
      { label: "Permission", icon: "key" },
      { label: "Denied", icon: "shield" },
    ],
    missionMuted: "You don't have access to this resource. ",
    missionEmphasis:
      "If you think that's a mistake, reach out and I'll check the gates.",
    primary: { label: "Back to home", href: "/" },
    secondary: { label: "Contact", href: "/contact" },
    ctaTitle: "Looking for the public site?",
    ctaEmphasis: "public",
    ctaDescription:
      "Services, portfolio, and contact are open. Admin routes stay behind a sign-in.",
    description:
      "You don't have permission to view this Twixr Solutions page.",
  },
  unauthorized: {
    code: "401",
    eyebrow: "401 · Sign in",
    headingLine1: "You need to",
    headingLine2: "sign in.",
    tiles: [
      { label: "Session", icon: "user" },
      { label: "Access", icon: "key" },
      { label: "Sign in", icon: "log-in" },
    ],
    missionMuted: "This area is for authenticated operators. ",
    missionEmphasis: "Sign in to continue, or head back to the public site.",
    primary: { label: "Sign in", href: "/admin/login" },
    secondary: { label: "Back to home", href: "/" },
    ctaTitle: "Not looking for admin?",
    ctaEmphasis: "admin",
    ctaDescription:
      "The marketing site doesn't need an account. Start a project from contact instead.",
    description:
      "Sign in to continue to this Twixr Solutions page.",
  },
} as const satisfies Record<string, StatusPageContent>;

export type StatusVariant = keyof typeof statusPages;
