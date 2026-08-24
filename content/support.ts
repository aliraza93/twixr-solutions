import { site } from "./site";
import { offerings } from "./services";

export const support = {
  eyebrow: "Support Hub",
  headingBefore: "Let's build your next",
  headingEmphasis: "product.",
  lead: "Can't find what you're looking for? Contact me directly - I'll tell you plainly if I'm the right engineer for it.",
  primaryCta: site.primaryCta,
  secondaryCta: { label: "View Portfolio", href: "/portfolio" },
  waysEyebrow: "Three ways in",
  contactLabel: "Get in touch",
  contactHref: site.primaryCta.href,
  faqHeading: "Common questions",
  audiences: offerings.map((item) => ({
    eyebrow: item.audience,
    title: item.title,
    body: item.desc,
  })),
} as const;
