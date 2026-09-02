import type { RecommendedInternalLink } from "@/lib/pipeline/seo/types";

/**
 * Extra prompt block for timely/news briefs: verify claims, still link evergreen inventory.
 */
export function formatNewsGuidanceForPrompt(input: {
  requiresLiveSource: boolean;
  evergreenLinks: RecommendedInternalLink[];
}): string {
  if (!input.requiresLiveSource) return "";

  const evergreen = input.evergreenLinks
    .filter((l) => l.type === "blog" || l.type === "service" || l.type === "portfolio")
    .slice(0, 4);

  const lines = [
    "NEWS / TIMELY RULES (this brief requires live sources):",
    "- Every current fact (model name, version, price, date, feature, benchmark, company claim) MUST appear in sources[].",
    "- Do not use stale model knowledge for breaking news. If you cannot verify, drop the news claim.",
    "- Write the builder's take - what changes for people who ship - not a press-release rewrite.",
    "- Still connect to evergreen Twixr pages when natural (service, portfolio, related how-to).",
    "- Never invent internal URLs; only use ALLOWED INTERNAL LINKS.",
  ];

  if (evergreen.length) {
    lines.push("Preferred evergreen anchors if they fit this news take:");
    for (const l of evergreen) {
      lines.push(`- [${l.type}] ${l.title} -> ${l.url}`);
    }
  } else {
    lines.push(
      "No strong evergreen inventory match; omit forced commercial links."
    );
  }

  return lines.join("\n");
}

export function formatVoicePolishForPrompt(): string {
  return [
    "VOICE POLISH (do not abandon for SEO):",
    "- Senior engineer to peers. Direct, practical, dry confidence.",
    "- Short sentences. Active voice. Numbers over adjectives.",
    "- Sell the outcome, not the stack.",
    "- No fake thought leadership, no generic AI filler, near-zero emojis.",
  ].join("\n");
}
