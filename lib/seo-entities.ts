/**
 * Technology name to Wikidata entity.
 *
 * Entity linking is the highest-leverage structured-data signal for AI
 * Overviews and LLM citation: it tells a generative engine which "Laravel" or
 * "Redis" a page is about instead of leaving it to infer from surrounding text.
 * Only well-known, unambiguous entities belong here - a wrong sameAs is worse
 * than none.
 */

export type EntityRef = { name: string; sameAs: string };

const ENTITIES: Record<string, string> = {
  laravel: "https://www.wikidata.org/wiki/Q15206306",
  php: "https://www.wikidata.org/wiki/Q59",
  "node.js": "https://www.wikidata.org/wiki/Q756100",
  nodejs: "https://www.wikidata.org/wiki/Q756100",
  nestjs: "https://www.wikidata.org/wiki/Q10659333",
  typescript: "https://www.wikidata.org/wiki/Q978185",
  javascript: "https://www.wikidata.org/wiki/Q2005",
  react: "https://www.wikidata.org/wiki/Q19399674",
  "next.js": "https://www.wikidata.org/wiki/Q96402722",
  nextjs: "https://www.wikidata.org/wiki/Q96402722",
  "vue.js": "https://www.wikidata.org/wiki/Q16889842",
  vue: "https://www.wikidata.org/wiki/Q16889842",
  tailwind: "https://www.wikidata.org/wiki/Q87000652",
  "tailwind css": "https://www.wikidata.org/wiki/Q87000652",
  postgresql: "https://www.wikidata.org/wiki/Q192490",
  postgres: "https://www.wikidata.org/wiki/Q192490",
  mysql: "https://www.wikidata.org/wiki/Q850",
  redis: "https://www.wikidata.org/wiki/Q2136322",
  sqlite: "https://www.wikidata.org/wiki/Q319417",
  docker: "https://www.wikidata.org/wiki/Q15206305",
  kubernetes: "https://www.wikidata.org/wiki/Q22661306",
  "amazon web services": "https://www.wikidata.org/wiki/Q715967",
  aws: "https://www.wikidata.org/wiki/Q715967",
  nginx: "https://www.wikidata.org/wiki/Q306144",
  git: "https://www.wikidata.org/wiki/Q186055",
  graphql: "https://www.wikidata.org/wiki/Q25104949",
  json: "https://www.wikidata.org/wiki/Q2063",
  stripe: "https://www.wikidata.org/wiki/Q2282829",
  twilio: "https://www.wikidata.org/wiki/Q7855023",
  cloudflare: "https://www.wikidata.org/wiki/Q2487685",
  vercel: "https://www.wikidata.org/wiki/Q111331533",
  prisma: "https://www.wikidata.org/wiki/Q110319384",
  "machine learning": "https://www.wikidata.org/wiki/Q2539",
  "large language model": "https://www.wikidata.org/wiki/Q115305900",
  "search engine optimization": "https://www.wikidata.org/wiki/Q180711",
  seo: "https://www.wikidata.org/wiki/Q180711",
  devops: "https://www.wikidata.org/wiki/Q1544105",
  "continuous integration": "https://www.wikidata.org/wiki/Q965769",
  microservices: "https://www.wikidata.org/wiki/Q19903510",
  "software as a service": "https://www.wikidata.org/wiki/Q1254596",
  saas: "https://www.wikidata.org/wiki/Q1254596",
};

/** Canonical display names, so "nodejs" and "node.js" collapse to one entity. */
const DISPLAY: Record<string, string> = {
  nodejs: "Node.js",
  "node.js": "Node.js",
  nextjs: "Next.js",
  "next.js": "Next.js",
  vue: "Vue.js",
  "vue.js": "Vue.js",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  aws: "Amazon Web Services",
  seo: "Search engine optimization",
  saas: "Software as a service",
  tailwind: "Tailwind CSS",
  "tailwind css": "Tailwind CSS",
  php: "PHP",
  json: "JSON",
  devops: "DevOps",
  nestjs: "NestJS",
  graphql: "GraphQL",
};

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((w) => (w.length > 3 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Resolve tags and text to distinct entity references, longest match first so
 * "tailwind css" wins over "tailwind".
 */
export function resolveEntities(
  tags: readonly string[],
  text = "",
  limit = 8
): EntityRef[] {
  const haystack = `${tags.join(" ")} ${text}`.toLowerCase();
  const keys = Object.keys(ENTITIES).sort((a, b) => b.length - a.length);
  const seen = new Set<string>();
  const out: EntityRef[] = [];

  for (const key of keys) {
    if (out.length >= limit) break;
    // Word-boundary-ish match that tolerates the dots in "node.js".
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(haystack)) {
      continue;
    }
    const sameAs = ENTITIES[key];
    if (seen.has(sameAs)) continue;
    seen.add(sameAs);
    out.push({ name: DISPLAY[key] ?? titleCase(key), sameAs });
  }

  return out;
}
