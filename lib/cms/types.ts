import type { BlogContentBlock, BlogListing, BlogPost } from "@/content/blog-schema";
import type { FaqItem } from "@/content/faq";
import type { Testimonial } from "@/content/testimonials";
import type { PortfolioCaseStudy, PortfolioProject } from "@/lib/data/portfolio";
import type { ServiceDetail, ServiceListingItem } from "@/lib/data/services";

export type NavLink = {
  label: string;
  href: string;
};

export type SiteCta = {
  label: string;
  href: string;
};

export type SiteProof = {
  label: string;
  value: string;
};

export type SiteContactMethod = {
  key: string;
  label: string;
  value: string;
  href: string;
  external: boolean;
};

export type SiteContent = {
  name: string;
  brand: string;
  role: string;
  tagline: string;
  yearsExperience: string;
  proof: SiteProof[];
  contact: {
    email: string;
    upwork: string;
    fiverr: string;
    linkedin: string;
    github: string;
    booking: string;
  };
  responseTime: string;
  contactMethods: SiteContactMethod[];
  primaryCta: SiteCta;
  nav: NavLink[];
};

export type HeroWord = {
  text?: string;
  kind: "plain" | "emphasis" | "cycle";
};

export type HeroLogo = {
  icon: string;
  label: string;
};

export type HeroStat = {
  label: string;
  value: string;
  unit: string;
};

export type HeroContent = {
  eyebrow: string;
  /**
   * Plain-text mirror of headingLines, kept in sync by the admin form.
   * The visible h1 now carries the real text, so nothing renders this; it
   * stays as a convenient plain string for metadata and search.
   */
  stableHeading: string;
  /** Retired. The hero states one line instead of cycling words. */
  rotatingWords: string[];
  headingLines: HeroWord[][];
  subheading: string;
  proofChip: string;
  primaryCta: SiteCta;
  secondaryCta: SiteCta;
  logosCaption: string;
  techLogos: HeroLogo[];
  moreLogos: HeroLogo[];
  /** Hero proof ledger. Optional so stored CMS rows written before this
   *  existed still parse; falls back to the dashboard stats. */
  stats?: HeroStat[];
  dashboard: {
    url: string;
    kicker: string;
    title: string;
    stats: HeroStat[];
    requests: string;
    representative: boolean;
  };
  scrollHref: string;
};

export type InquiryStatus = "unread" | "read" | "replied" | "archived";

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  company: string;
  projectType: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
};

export type BlogPostRecord = BlogPost & {
  id: string;
  body: string;
  published: boolean;
  order: number;
  faqs: { question: string; answer: string }[];
};

export type {
  BlogContentBlock,
  BlogListing,
  BlogPost,
  FaqItem,
  Testimonial,
  PortfolioCaseStudy,
  PortfolioProject,
  ServiceDetail,
  ServiceListingItem,
};
