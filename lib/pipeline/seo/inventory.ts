import { getBlogListings } from "@/lib/cms/blog";
import { getPortfolioProjects } from "@/lib/cms/portfolio";
import { getServiceListings } from "@/lib/cms/services";
import { site } from "@/content/site";
import { absoluteUrl } from "@/lib/seo";
import type { InventoryItem } from "@/lib/pipeline/seo/types";
import { normalizeSiteUrl } from "@/lib/pipeline/seo/types";

const STATIC_PAGES: Array<{
  path: string;
  title: string;
  description: string;
}> = [
  {
    path: "/",
    title: `${site.brand} | ${site.role}`,
    description: site.tagline,
  },
  {
    path: "/about",
    title: `About ${site.name}`,
    description: site.tagline,
  },
  {
    path: "/services",
    title: "Services",
    description: "Laravel, Node, Next.js, Vue, AWS, AI automation, and SaaS engineering.",
  },
  {
    path: "/portfolio",
    title: "Portfolio",
    description: "Selected SaaS, API, cloud, and AI automation projects.",
  },
  {
    path: "/blog",
    title: "Blog",
    description: "Engineering notes on Laravel, NestJS, AWS, AI, and freelancing.",
  },
  {
    path: "/contact",
    title: "Contact",
    description: "Start a project with Twixr Solutions.",
  },
  {
    path: "/testimonials",
    title: "Results",
    description: "Client results and reviews.",
  },
];

/**
 * Machine-readable inventory of indexable site pages.
 * Only URLs that exist in CMS/data/static routes - never invented.
 */
export async function getSiteContentInventory(): Promise<InventoryItem[]> {
  const items: InventoryItem[] = [];

  for (const page of STATIC_PAGES) {
    items.push({
      type: "page",
      path: page.path,
      url: normalizeSiteUrl(absoluteUrl(page.path)),
      title: page.title,
      description: page.description,
      topics: [page.title],
    });
  }

  try {
    const services = await getServiceListings();
    for (const s of services) {
      const path = `/services/${s.slug}`;
      items.push({
        type: "service",
        path,
        url: normalizeSiteUrl(absoluteUrl(path)),
        title: s.title,
        description: s.description,
        category: s.categoryLabel,
        tags: [...s.tags],
        topics: [s.title, s.categoryLabel, ...s.tags],
      });
    }
  } catch (error) {
    console.error("SEO inventory services failed:", error);
  }

  try {
    const projects = await getPortfolioProjects();
    for (const p of projects) {
      const path = `/portfolio/${p.slug}`;
      items.push({
        type: "portfolio",
        path,
        url: normalizeSiteUrl(absoluteUrl(path)),
        title: p.title,
        description: p.description,
        category: p.categoryLabel,
        tags: [...p.tags],
        topics: [p.title, p.categoryLabel, ...p.tags],
      });
    }
  } catch (error) {
    console.error("SEO inventory portfolio failed:", error);
  }

  try {
    const blogs = await getBlogListings();
    for (const b of blogs) {
      const path = `/blog/${b.slug}`;
      items.push({
        type: "blog",
        path,
        url: normalizeSiteUrl(absoluteUrl(path)),
        title: b.title,
        description: b.excerpt,
        category: b.category,
        tags: [...b.tags],
        topics: [b.title, b.category, ...b.tags],
      });
    }
  } catch (error) {
    console.error("SEO inventory blogs failed:", error);
  }

  return items;
}

export function inventoryUrlAllowlist(items: InventoryItem[]): Set<string> {
  return new Set(items.map((i) => normalizeSiteUrl(i.url)));
}
