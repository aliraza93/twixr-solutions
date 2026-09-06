import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Brief } from "@prisma/client";
import { BANNED_PHRASES } from "@/content/pipeline/banned-phrases";
import type { DepthGuidance } from "@/lib/pipeline/seo/depth";
import { formatDepthGuidanceForPrompt } from "@/lib/pipeline/seo/depth";
import {
  formatNewsGuidanceForPrompt,
  formatVoicePolishForPrompt,
} from "@/lib/pipeline/seo/editorial";
import { formatRotationForPrompt } from "@/lib/pipeline/seo/formats";
import type { RecommendedInternalLink } from "@/lib/pipeline/seo/types";
import { formatLinkPlanForPrompt } from "@/lib/pipeline/seo/internal-links";

export function readKb(name: string): string {
  const file = name.endsWith(".md") ? name : `${name}.md`;
  return readFileSync(join(process.cwd(), "content/pipeline", file), "utf8");
}

function absoluteRules(): string {
  return [
    "ABSOLUTE RULES (never violate):",
    "1. Never use em dashes (U+2014), en dashes (U+2013), or minus signs (U+2212).",
    '   Use a spaced hyphen " - " or restructure the sentence. Never use &mdash; or &ndash;.',
    "2. Never invent metrics, client names, dates, versions, prices, benchmarks, or testimonials",
    "   that are not in the brief (or, for live-source briefs, not cited in sources).",
    "3. Never use these banned phrases (case-insensitive substring):",
    `   ${BANNED_PHRASES.join("; ")}`,
    "4. Voice: senior engineer talking to peers. Direct, practical, dry confidence.",
    "5. Near-zero emojis. Prefer none.",
    "6. Never invent internal site URLs. Only link to URLs explicitly provided in the prompt.",
  ].join("\n");
}

export type BlogPromptSeoContext = {
  primaryKeyword?: string;
  searchIntent?: string;
  contentCluster?: string;
  cannibalizationRisk?: number;
  recommendedInternalLinks?: RecommendedInternalLink[];
  /** Preformatted content-gap / commercial context block. */
  gapContext?: string;
  depth?: DepthGuidance;
  sourceUrl?: string;
  sourceExcerpt?: string;
  additionalInstructions?: string;
  formatOverride?: string;
};

export function buildBlogPrompt(
  brief: Brief,
  seo?: BlogPromptSeoContext
): { system: string; user: string } {
  const voice = readKb("voice-guide");
  const pillars = readKb("content-pillars");
  const dontDo = readKb("dont-do");
  const codeCard = readKb("code-card-style");
  const swipe = readKb("swipe-file");

  const system = [
    "You draft one long-form blog post for Twixr Solutions / Ali Raza.",
    "You MUST call the submit_blog_draft tool with the finished draft. Do not reply with free-form prose.",
    "",
    absoluteRules(),
    "",
    "VOICE GUIDE:",
    voice,
  ].join("\n");

  const keyword = seo?.primaryKeyword || brief.targetKeyword || brief.topic;
  const cluster =
    seo?.contentCluster ||
    brief.pillar.split("/")[1]?.trim() ||
    brief.pillar;
  const intent =
    seo?.searchIntent ||
    (brief.requiresLiveSource
      ? "Explain what this news changes for engineers who ship, with verified facts only."
      : "Help a peer engineer solve a concrete technical or business problem.");

  const linkBlock = formatLinkPlanForPrompt(seo?.recommendedInternalLinks ?? []);
  const depth = seo?.depth;
  const depthBlock = depth ? formatDepthGuidanceForPrompt(depth) : "";
  const formatBlock = depth ? formatRotationForPrompt(depth.format) : "";
  const newsBlock = formatNewsGuidanceForPrompt({
    requiresLiveSource: brief.requiresLiveSource,
    evergreenLinks: seo?.recommendedInternalLinks ?? [],
  });
  const voiceBlock = formatVoicePolishForPrompt();

  const sourceBlock =
    seo?.sourceExcerpt && seo.sourceExcerpt.trim()
      ? [
          "SOURCE FACTS (verified excerpt - do not invent beyond this + brief):",
          seo.sourceUrl ? `Source URL: ${seo.sourceUrl}` : "",
          "Use these as the factual foundation. Add Ali/Twixr builder perspective and practical implications.",
          "Do not rewrite the source as a press release.",
          seo.sourceExcerpt.trim().slice(0, 10000),
        ]
          .filter(Boolean)
          .join("\n")
      : seo?.sourceUrl
        ? `Source URL (cite in sources[]): ${seo.sourceUrl}`
        : "";

  const adminBlock =
    seo?.additionalInstructions?.trim() ||
    (brief as Brief & { extraInstructions?: string }).extraInstructions?.trim()
      ? [
          "ADDITIONAL ADMIN INSTRUCTIONS (honor when compatible with absolute rules):",
          (
            seo?.additionalInstructions?.trim() ||
            (brief as Brief & { extraInstructions?: string }).extraInstructions ||
            ""
          ).trim(),
        ].join("\n")
      : "";

  const angleNote = brief.angle
    ? "Preserve the admin/editorial angle; SEO may refine keyword and cluster only."
    : "";

  const user = [
    "Write today's blog post from this brief.",
    "",
    `Pillar: ${brief.pillar}`,
    `Topic: ${brief.topic}`,
    `Target keyword: ${keyword}`,
    `Content cluster: ${cluster}`,
    `Search intent: ${intent}`,
    seo?.cannibalizationRisk !== undefined
      ? `Cannibalization risk (0-1, informational): ${seo.cannibalizationRisk.toFixed(2)}`
      : "",
    `Angle: ${brief.angle || "(derive a sharp, practical angle)"}`,
    angleNote,
    `Real example (use only if non-empty; never invent): ${brief.realExample || "(none)"}`,
    `Requires live source: ${brief.requiresLiveSource ? "yes - every fact-bearing claim must cite a URL in sources" : "no"}`,
    "",
    voiceBlock,
    depthBlock,
    formatBlock,
    newsBlock,
    sourceBlock,
    adminBlock,
    "",
    linkBlock,
    seo?.gapContext || "",
    "",
    "CONTENT PILLARS:",
    pillars,
    "",
    "DO NOT DO:",
    dontDo,
    "",
    "CODE CARD STYLE (for code-tip imagery prompts):",
    codeCard,
    "",
    "SWIPE / STRUCTURE HINTS:",
    swipe,
    "",
    "OUTPUT: call submit_blog_draft with these fields:",
    "{",
    '  "slug": "kebab-case-unique",',
    '  "title": "string",',
    '  "excerpt": "<=160 chars, meta description, natural keyword",',
    '  "category": "site blog category string",',
    '  "tags": ["3-6 tags"],',
    '  "readingTime": "e.g. 6 min read",',
    '  "body": "markdown with ## / ### headings; lists use - ; inline images as ![alt](__INLINE_n__) on their own line",',
    '  "faqs": [{"question":"...","answer":"..."}]  // 3-5',
    '  "coverAlt": "descriptive alt, no keyword stuffing (e.g. Laravel queue worker and job flow)",',
    '  "inlineImagePrompts": [{"placeholder":"__INLINE_1__","prompt":"...","alt":"..."}],  // 2-3',
    '  "sources": ["https://..."]  // required non-empty when requiresLiveSource',
    '  "primaryKeyword": "string",',
    '  "searchIntent": "one sentence",',
    '  "contentCluster": "short cluster label"',
    "}",
    "",
    "Body rules: markdown only. Prefer structured faqs (do not rely on a ## FAQ section).",
    "Sell the outcome, not the stack. Problem-first opening.",
    "REQUIRED: include exactly 2 or 3 inline image placeholders in the body as their own lines,",
    "e.g. ![Diagram of the N+1 fix](__INLINE_1__), and matching inlineImagePrompts entries.",
    "Each inlineImagePrompts.prompt must describe a specific visual (diagram, before/after, code card, metaphor).",
    "When using internal links, write them as markdown [anchor](absolute-url) using only allowed URLs.",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

export type LinkedInBlogContext = {
  title: string;
  excerpt: string;
  body: string;
  category: string;
  /** Absolute URL to the related Twixr blog post. */
  blogUrl: string;
  topic?: string;
  realExample?: string;
};

export function buildLinkedInPrompt(blog: LinkedInBlogContext): {
  system: string;
  user: string;
} {
  const voice = readKb("voice-guide");
  const dontDo = readKb("dont-do");

  const system = [
    "You are Ali Raza writing your own LinkedIn post. First person. Not a brand account, not a generic ghostwriter voice.",
    "Turn ONE idea from the blog into a single scroll-stopping post for engineers, founders, and CTOs.",
    "You MUST call the submit_linkedin_draft tool with the finished post. Do not reply with free-form prose.",
    "",
    absoluteRules(),
    "",
    "WHAT MAKES THESE POSTS WORK:",
    "- One idea, developed with a real point of view - not a summary of the article.",
    "- The value is YOUR take: a tradeoff you hit, a call you made, something that surprised you in production.",
    "- Concrete over abstract: name the tool, the version, the number, the failure mode.",
    "- It should read like a senior engineer talking in a code review, not like a company announcement.",
    "",
    "VOICE GUIDE:",
    voice,
  ].join("\n");

  const user = [
    "Write today's LinkedIn post from this blog. Pick the single most useful or most contrarian point and build the whole post around it. Do NOT restate the article.",
    "",
    `Title: ${blog.title}`,
    `Category: ${blog.category}`,
    `Excerpt: ${blog.excerpt}`,
    blog.topic ? `Topic: ${blog.topic}` : "",
    `Real example (use ONLY if non-empty - never invent one): ${blog.realExample || "(none - keep the personal angle general and honest, do not fabricate a story, client, or metric)"}`,
    `Blog URL (must appear once, on its own line before the hashtags): ${blog.blogUrl}`,
    "",
    "Source material (for grounding only - do not outline it or paste sections):",
    blog.excerpt,
    "",
    blog.body.slice(0, 3000),
    "",
    "DO NOT DO:",
    dontDo,
    "",
    "STRUCTURE:",
    "- HOOK (line 1, at most 2 lines): open on a specific pain, tension, or claim the reader already feels. Make them think \"that is me\" or \"wait, is that true?\". BANNED opener shapes: \"Most posts about X are just...\", \"Let us talk about...\", \"Here is the thing about...\", \"X is out. Here is what...\", anything starting \"In today's ... world\", and any flat topic announcement.",
    "- BODY (3 to 6 short lines): one idea per line, a blank line between thoughts so it scans on a phone. Name real tools, versions, patterns, numbers. Show the tradeoff, not just the feature. No 6+ bullet dump, no mini-essay.",
    "- PERSONAL ANGLE (1 line): a real, first-person builder's take. If no real example is provided, keep it honest and general - do not invent a client, metric, or war story.",
    "- CTA (1 line): one genuine, specific question that invites a real reply. Not \"What do you think?\" and not \"What are you using X for?\". Ask about their actual decision or experience.",
    `- LINK: a line reading exactly - Full write-up: ${blog.blogUrl}`,
    "- HASHTAGS: 4 to 5 on the final line, mixing one or two broad tags with specific ones. No hashtag walls.",
    "",
    "LENGTH: aim for 700 to 1300 characters. Hard max 3000. Sharper and shorter beats longer.",
    "TONE: first person, senior, dry confidence, near-zero emojis (prefer none). Sell the outcome; the tech is proof lower down.",
    "",
    "OUTPUT: call submit_linkedin_draft with:",
    "{",
    '  "text": "the full post including the blog URL line and the hashtag line",',
    '  "altHooks": ["a genuinely different angle hook", "a third angle hook"],',
    '  "hashtags": ["#Tag1", "#Tag2", "..."]  // the same 4-5 tags used on the last line',
    "}",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

export type XBlogContext = {
  title: string;
  excerpt: string;
  category: string;
  blogUrl: string;
  topic?: string;
};

export function buildXPrompt(blog: XBlogContext): {
  system: string;
  user: string;
} {
  const dontDo = readKb("dont-do");

  const system = [
    "You write one short X (Twitter) post for Ali Raza / Twixr Solutions.",
    "You MUST call the submit_x_draft tool. Do not reply with free-form prose.",
    "",
    absoluteRules(),
    "6. Hard max 280 characters for the full post text (X counts URLs as 23 chars).",
    "7. Punchy feed post: hook + one tip. Not a LinkedIn essay. Not a thread.",
  ].join("\n");

  const user = [
    "Create one X post from this blog.",
    "",
    `Title: ${blog.title}`,
    `Category: ${blog.category}`,
    `Excerpt: ${blog.excerpt}`,
    blog.topic ? `Topic: ${blog.topic}` : "",
    `Blog URL (include near the end): ${blog.blogUrl}`,
    "",
    "DO NOT DO:",
    dontDo,
    "",
    "Rules:",
    "- Max 280 characters total including the URL and hashtags.",
    "- 1-3 short lines. Problem-first hook.",
    "- End with the blog URL, then 1-2 hashtags max (or none).",
    "- No emojis unless one fits naturally. Prefer none.",
    "",
    "OUTPUT: call submit_x_draft with:",
    "{",
    '  "text": "full tweet including URL",',
    '  "altHooks": ["alt hook 1", "alt hook 2"]',
    "}",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}
