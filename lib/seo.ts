import type { Metadata } from "next";
import { site } from "@/content/site";

/** Single canonical host for the whole site. Matches the live deployment. */
export const SITE_URL = "https://www.twixrsolutions.com";
export const SITE_NAME = "Twixr Solutions";
export const DEFAULT_OG = "/og-image.png";
export const TWITTER_HANDLE = "@twixrsolutions";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

/** Only emit contact values that are real (not the REPLACE_ME placeholders). */
function real(value?: string): string | undefined {
  if (!value || value.includes("REPLACE_ME")) return undefined;
  return value;
}

const sameAs = [site.contact.upwork, site.contact.fiverr, site.contact.linkedin]
  .map(real)
  .filter((v): v is string => Boolean(v));

type SeoInput = {
  /** Short title — the "%s | Twixr Solutions" template adds the brand for <title>. */
  title: string;
  description: string;
  /** Absolute path, e.g. "/about" or "/blog/my-post". */
  path: string;
  image?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  authors?: string[];
  noindex?: boolean;
};

/** Build consistent page Metadata (canonical + OpenGraph + Twitter) for every page. */
export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG,
  type = "website",
  publishedTime,
  authors,
  noindex,
}: SeoInput): Metadata {
  const url = absoluteUrl(path);
  const ogTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title: ogTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: ogTitle }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(authors ? { authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [image],
      creator: TWITTER_HANDLE,
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/* ------------------------------------------------------------------ */
/* JSON-LD structured-data builders (return nodes without @context).   */
/* Wrap one or many with jsonLdGraph() before rendering.               */
/* ------------------------------------------------------------------ */

type Node = Record<string, unknown>;

export function jsonLdGraph(nodes: Node[]): Node {
  return { "@context": "https://schema.org", "@graph": nodes };
}

const ORG_ID = `${SITE_URL}/#organization`;
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationNode(): Node {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon-512-maskable.png"),
    image: absoluteUrl(DEFAULT_OG),
    description: site.tagline,
    founder: { "@id": PERSON_ID },
    ...(real(site.contact.email) ? { email: real(site.contact.email) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function personNode(): Node {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: site.name,
    url: absoluteUrl("/about"),
    jobTitle: site.role,
    worksFor: { "@id": ORG_ID },
    knowsAbout: [
      "Laravel",
      "PHP",
      "Node.js",
      "Next.js",
      "React",
      "Vue.js",
      "Nuxt.js",
      "TypeScript",
      "PostgreSQL",
      "MySQL",
      "AWS",
      "Docker",
      "DevOps",
      "SaaS development",
      "REST APIs",
      "Cloud architecture",
    ],
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteNode(): Node {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: site.tagline,
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

/** Site-wide graph for the root layout. */
export function siteJsonLd(): Node {
  return jsonLdGraph([organizationNode(), personNode(), websiteNode()]);
}

export function breadcrumbNode(
  items: { name: string; path: string }[]
): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleNode(post: {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  author?: string;
}): Node {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.image?.startsWith("http") ? post.image : absoluteUrl(post.image),
    datePublished: post.date,
    dateModified: post.date,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@id": PERSON_ID, name: post.author ?? site.name },
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

export function serviceNode(service: {
  slug: string;
  title: string;
  description: string;
}): Node {
  return {
    "@type": "Service",
    name: service.title,
    description: service.description,
    serviceType: service.title,
    provider: { "@id": ORG_ID },
    areaServed: "Worldwide",
    url: absoluteUrl(`/services/${service.slug}`),
  };
}

export function faqPageNode(faqs: { question: string; answer: string }[]): Node {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
