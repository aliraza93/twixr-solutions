import { getBlogListings } from "@/content/blog";
import { getServiceSlugs, getServiceBySlug } from "@/lib/data/services";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/content/site";

// llms.txt — a concise, machine-readable map of the site for AI models/agents.
// Spec: https://llmstxt.org  •  Static at build time; regenerated on each deploy.
export const dynamic = "force-static";

export function GET(): Response {
  const posts = getBlogListings();
  const services = getServiceSlugs()
    .map((slug) => getServiceBySlug(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const lines: string[] = [
    `# ${site.brand}`,
    ``,
    `> ${site.tagline}`,
    ``,
    `${site.name}, ${site.role} and founder of ${site.brand}. Upwork Top Rated Plus (top 3% of talent), 100% Job Success across 49 jobs and 2,600+ hours, ${site.yearsExperience} years. Stack: Laravel, PHP, Node.js/NestJS, Next.js, React, Vue, PostgreSQL, MySQL, and AWS (multi-tenant SaaS, e-commerce, REST APIs, cloud/DevOps).`,
    ``,
    `## Key pages`,
    `- [About](${absoluteUrl("/about")}): Background, experience, and Upwork Top Rated Plus profile.`,
    `- [Services](${absoluteUrl("/services")}): SaaS builds, Laravel/Node APIs, Next.js/Vue frontends, cloud & DevOps, AI automation.`,
    `- [Portfolio](${absoluteUrl("/portfolio")}): Case studies — LeadQuiz, ManagePH, PropDaddy, Forage, and more.`,
    `- [Results](${absoluteUrl("/testimonials")}): Verified Upwork client reviews.`,
    `- [Contact](${absoluteUrl("/contact")}): Start a project.`,
    ``,
    `## Services`,
    ...services.map(
      (s) => `- [${s.title}](${absoluteUrl(`/services/${s.slug}`)}): ${s.description}`
    ),
    ``,
    `## Blog`,
    ...posts.map(
      (p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}): ${p.excerpt}`
    ),
    ``,
    `## Contact`,
    `- Email: ${site.contact.email}`,
    `- Upwork: ${site.contact.upwork}`,
    `- LinkedIn: ${site.contact.linkedin}`,
    ``,
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
