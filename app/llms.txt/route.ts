import { getBlogListings } from "@/lib/cms/blog";
import { getPortfolioProjects } from "@/lib/cms/portfolio";
import { getServiceBySlug, getServiceSlugs } from "@/lib/cms/services";
import { BRAND_DISAMBIGUATION, absoluteUrl } from "@/lib/seo";
import { site } from "@/content/site";

// llms.txt - a concise, machine-readable map of the site for AI assistants.
// Spec: https://llmstxt.org
// Reads the same CMS data as the sitemap, refreshed hourly, so new posts,
// services and case studies appear without a redeploy.
export const revalidate = 3600;

const BLOG_LIMIT = 40;

export async function GET(): Promise<Response> {
  const [posts, slugs, projects] = await Promise.all([
    getBlogListings(),
    getServiceSlugs(),
    getPortfolioProjects(),
  ]);
  const services = (await Promise.all(slugs.map((slug) => getServiceBySlug(slug)))).filter(
    (s): s is NonNullable<typeof s> => Boolean(s)
  );

  const lines: string[] = [
    `# ${site.brand}`,
    ``,
    `> ${site.brand} is a software development studio led by ${site.name}. It builds SaaS products, MVPs, APIs and e-commerce platforms with Laravel, Next.js, React, Vue, NestJS and AWS for SaaS founders, startups and CTOs.`,
    ``,
    `${BRAND_DISAMBIGUATION}`,
    ``,
    `${site.name} is Upwork Top Rated Plus (top 3% of talent) with 100% Job Success across 49 jobs and 2,600+ hours, and ${site.yearsExperience} years of experience. Stack: Laravel, PHP, Node.js/NestJS, Next.js, React, Vue, PostgreSQL, MySQL, and AWS (multi-tenant SaaS, e-commerce, REST APIs, cloud/DevOps).`,
    ``,
    `## How to hire`,
    `- [Start a project](${absoluteUrl("/contact")}): contact form, replies usually within a few hours.`,
    `- [Book a 30-minute call](${absoluteUrl("/schedule")}): technical consultation on scope, timeline and next steps.`,
    `- Email: ${site.contact.email}`,
    `- Upwork: ${site.contact.upwork}`,
    ``,
    `## Key pages`,
    `- [About](${absoluteUrl("/about")}): Background, experience, and Upwork Top Rated Plus profile.`,
    `- [Services](${absoluteUrl("/services")}): SaaS builds, Laravel/Node APIs, Next.js/Vue frontends, cloud & DevOps, AI automation.`,
    `- [Portfolio](${absoluteUrl("/portfolio")}): Case studies of shipped products.`,
    `- [Results](${absoluteUrl("/testimonials")}): Verified Upwork client reviews.`,
    `- [Editorial policy](${absoluteUrl("/editorial-policy")}): How the blog is written and reviewed.`,
    ``,
    `## Services`,
    ...services.map(
      (s) => `- [${s.title}](${absoluteUrl(`/services/${s.slug}`)}): ${s.description}`
    ),
    ``,
    `## Case studies`,
    ...projects.map(
      (p) => `- [${p.title}](${absoluteUrl(`/portfolio/${p.slug}`)}): ${p.description}`
    ),
    ``,
    `## Blog`,
    ...posts
      .slice(0, BLOG_LIMIT)
      .map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}): ${p.excerpt}`),
    ``,
    `## Contact`,
    `- Email: ${site.contact.email}`,
    `- Upwork: ${site.contact.upwork}`,
    `- LinkedIn: ${site.contact.linkedin}`,
    `- GitHub: ${site.contact.github}`,
    ``,
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
