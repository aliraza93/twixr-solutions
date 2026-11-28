import type { Metadata } from "next";
import { site } from "@/content/site";
import { resolveEntities } from "@/lib/seo-entities";
import { seoOverride } from "@/lib/seo-overrides";

/** Single canonical host for the whole site. Matches the live deployment. */
export const SITE_URL = "https://www.twixrsolutions.com";
export const SITE_NAME = "Twixr Solutions";
export const DEFAULT_OG = "/og-image.png";
export const TWITTER_HANDLE = "@twixrsolutions";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * Return a social-share-safe image URL. WhatsApp/iMessage refuse to render a
 * preview (no image AND no title/description) when og:image is a heavy PNG or
 * odd aspect ratio, so for Cloudinary sources we inject delivery transforms to
 * force a ~1200x630 JPEG under WhatsApp's size limit. Non-Cloudinary URLs
 * (relative /og-image.png, Vercel Blob, etc.) are returned unchanged.
 */
export function socialImage(url?: string): string {
  const img = url || DEFAULT_OG;
  const marker = "/image/upload/";
  const at = img.indexOf(marker);
  if (img.includes("res.cloudinary.com") && at !== -1) {
    const after = img.slice(at + marker.length);
    const firstSegment = after.split("/")[0] ?? "";
    const alreadyTransformed =
      firstSegment.includes("_") || firstSegment.includes(",");
    if (!alreadyTransformed) {
      return `${img.slice(0, at + marker.length)}f_jpg,q_auto:good,w_1200,h_630,c_fill,g_auto/${after}`;
    }
  }
  return img;
}

/** Only emit contact values that are real (not the REPLACE_ME placeholders). */
function real(value?: string): string | undefined {
  if (!value || value.includes("REPLACE_ME")) return undefined;
  return value;
}

const sameAs = [
  site.contact.upwork,
  site.contact.fiverr,
  site.contact.linkedin,
  site.contact.github,
]
  .map(real)
  .filter((v): v is string => Boolean(v));

type SeoInput = {
  /** Short title - the "%s | Twixr Solutions" template adds the brand for <title>. */
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
/** Longest <title> before search results start cutting it off. */
const TITLE_LIMIT = 60;

export function pageMetadata({
  title: rawTitle,
  description: rawDescription,
  path,
  image = DEFAULT_OG,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  tags,
  noindex,
}: SeoInput & { modifiedTime?: string; tags?: string[] }): Metadata {
  const override = seoOverride(path);
  const title = override?.title ?? rawTitle;
  const description = override?.description ?? rawDescription;
  const url = absoluteUrl(path);
  const branded = `${title} | ${SITE_NAME}`;
  // Long titles drop the brand suffix so the words people search for are not
  // the part that gets truncated.
  const fitsWithBrand = branded.length <= TITLE_LIMIT;
  const ogTitle = fitsWithBrand ? branded : title;
  const desc =
    description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description;
  const ogImage = socialImage(image);
  const isJpg = ogImage.includes("f_jpg");
  return {
    title: fitsWithBrand ? title : { absolute: title },
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type,
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title: ogTitle,
      description: desc,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
          ...(isJpg ? { type: "image/jpeg" } : {}),
        },
      ],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authors ? { authors } : {}),
      ...(tags?.length ? { tags } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: desc,
      images: [ogImage],
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

/**
 * Search for "twixr solutions" (28 Nov 2026) surfaced only look-alike names
 * (Twixor, Twixl, Twixify), so the entity says plainly which one this is.
 */
export const BRAND_DISAMBIGUATION =
  "Twixr Solutions is a software development studio in Lahore, Pakistan, founded by Ali Raza. It is not related to Twixor, Twixl or Twixify.";

const CORE_SERVICES = [
  "Laravel development",
  "Next.js and React development",
  "Vue.js development",
  "NestJS and Node.js API development",
  "SaaS and MVP development",
  "AWS cloud and DevOps",
];

export function organizationNode(): Node {
  return {
    "@type": ["Organization", "ProfessionalService"],
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: ["Twixr", "twixrsolutions"],
    disambiguatingDescription: BRAND_DISAMBIGUATION,
    url: SITE_URL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lahore",
      addressRegion: "Punjab",
      addressCountry: "PK",
    },
    areaServed: "Worldwide",
    knowsAbout: CORE_SERVICES,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Software development services",
      itemListElement: CORE_SERVICES.map((name) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name },
      })),
    },
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon-512.png"),
      width: 512,
      height: 512,
    },
    image: absoluteUrl(DEFAULT_OG),
    description: site.tagline,
    founder: { "@id": PERSON_ID },
    ...(real(site.contact.email) ? { email: real(site.contact.email) } : {}),
    ...(real(site.contact.email)
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            email: real(site.contact.email),
            url: absoluteUrl("/contact"),
            availableLanguage: ["English"],
          },
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function personNode(): Node {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: site.name,
    url: absoluteUrl("/about"),
    image: absoluteUrl("/ali-raza.jpg"),
    jobTitle: site.role,
    description: site.tagline,
    worksFor: { "@id": ORG_ID },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lahore",
      addressRegion: "Punjab",
      addressCountry: "PK",
    },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Government College University, Faisalabad",
    },
    award: "Upwork Top Rated Plus (Top 3% of talent)",
    knowsAbout: [
      "Laravel",
      "PHP",
      "Node.js",
      "NestJS",
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
      "Multi-tenant SaaS development",
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

/** Schema type varies with the article's shape, drawn per post by the pipeline. */
export type ArticleSchemaType = "BlogPosting" | "TechArticle" | "HowTo";

const ARTICLE_SCHEMA_TYPES: ArticleSchemaType[] = [
  "BlogPosting",
  "TechArticle",
  "HowTo",
];

/** Narrow a stored string to a known type, never emitting an invalid @type. */
export function asArticleSchemaType(value?: string): ArticleSchemaType {
  const hit = ARTICLE_SCHEMA_TYPES.find((t) => t === value);
  return hit ?? "BlogPosting";
}

export function articleNode(post: {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  author?: string;
  tags?: readonly string[];
  updatedAt?: string;
  /** Markdown body, used for wordCount and entity resolution. */
  body?: string;
  contentCluster?: string;
  /** Drawn by the variety plan; anything unrecognized falls back to BlogPosting. */
  schemaType?: string;
}): Node {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const imageUrl = socialImage(
    post.image?.startsWith("http")
      ? post.image
      : absoluteUrl(post.image || DEFAULT_OG)
  );

  const body = post.body ?? "";
  const wordCount = body
    ? body.trim().split(/\s+/).filter(Boolean).length
    : undefined;

  // Entity linking: tells a generative engine which "Laravel" this is about,
  // rather than leaving it to infer from the surrounding prose.
  const entities = resolveEntities(post.tags ?? [], `${post.title} ${body}`);
  const entityNodes = entities.map((e) => ({
    "@type": "Thing",
    name: e.name,
    sameAs: e.sameAs,
  }));

  const cluster = post.contentCluster?.trim();

  return {
    "@type": asArticleSchemaType(post.schemaType),
    headline: post.title,
    description: post.excerpt,
    image: imageUrl,
    datePublished: post.date,
    dateModified: post.updatedAt ?? post.date,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@id": PERSON_ID, name: post.author ?? site.name },
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
    ...(wordCount ? { wordCount } : {}),
    ...(entityNodes.length
      ? { about: entityNodes.slice(0, 3), mentions: entityNodes }
      : {}),
    ...(cluster
      ? {
          isPartOf: {
            "@type": "CollectionPage",
            name: cluster,
            url: absoluteUrl(`/blog/topics/${slugifyCluster(cluster)}`),
          },
        }
      : {}),
    ...(post.tags?.length
      ? { keywords: post.tags.join(", "), articleSection: post.tags[0] }
      : {}),
  };
}

/** Shared cluster-to-path rule, used by schema and the hub routes. */
export function slugifyCluster(cluster: string): string {
  return cluster
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/[*_`~#>]+/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      },
    })),
  };
}
