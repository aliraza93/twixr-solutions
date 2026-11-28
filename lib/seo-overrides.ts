/**
 * Hand-tuned titles and descriptions for pages whose CMS title does not
 * match how people search for them. Keyed by path. Picked from Search
 * Console data (28 days to 26 Nov 2026): pages with impressions but no
 * clicks, or service pages whose title did not name the technology.
 *
 * Keep each title under 60 characters including the " | Twixr Solutions"
 * suffix where possible; longer titles are sent without the suffix.
 * Only describe what the page actually contains.
 */
export const SEO_OVERRIDES: Record<string, { title?: string; description?: string }> = {
  "/services": {
    title: "Laravel & Next.js Development Services",
  },
  "/services/laravel-api-backend": {
    title: "Laravel & Node.js API Development",
  },
  "/services/nextjs-frontend": {
    title: "Next.js, React & Vue Frontend Development",
  },
  "/services/saas-web-app-development": {
    title: "SaaS & Web App Development",
  },
  "/services/cloud-infrastructure-devops": {
    title: "AWS Cloud & DevOps Services",
  },
  "/blog/upwork-mcp-server-guide": {
    title: "Upwork MCP Server: What It Does and How to Set It Up",
    description:
      "Upwork's MCP server lets Claude and ChatGPT find jobs, draft proposals and manage contracts. What it can do, its guardrails and limits, and how to set it up.",
  },
  "/blog/partial-composite-indexes-ordering-rule": {
    title: "Partial and Composite Indexes: The Column Order Rule",
  },
  "/portfolio/luckycharmgold-ecommerce-platform": {
    title: "LuckyCharmGold: Laravel E-commerce Case Study",
  },
};

export function seoOverride(path: string) {
  return SEO_OVERRIDES[path];
}
