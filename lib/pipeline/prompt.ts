import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Brief } from "@prisma/client";
import { BANNED_PHRASES } from "@/content/pipeline/banned-phrases";

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
  ].join("\n");
}

export function buildBlogPrompt(brief: Brief): { system: string; user: string } {
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

  const user = [
    "Write today's blog post from this brief.",
    "",
    `Pillar: ${brief.pillar}`,
    `Topic: ${brief.topic}`,
    `Target keyword: ${brief.targetKeyword || brief.topic}`,
    `Angle: ${brief.angle || "(derive a sharp, practical angle)"}`,
    `Real example (use only if non-empty; never invent): ${brief.realExample || "(none)"}`,
    `Requires live source: ${brief.requiresLiveSource ? "yes - every fact-bearing claim must cite a URL in sources" : "no"}`,
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
    '  "coverAlt": "string",',
    '  "inlineImagePrompts": [{"placeholder":"__INLINE_1__","prompt":"...","alt":"..."}],  // 2-3',
    '  "sources": ["https://..."]  // required non-empty when requiresLiveSource',
    "}",
    "",
    "Body rules: markdown only. Prefer structured faqs (do not rely on a ## FAQ section).",
    "Sell the outcome, not the stack. Problem-first opening.",
    "REQUIRED: include exactly 2 or 3 inline image placeholders in the body as their own lines,",
    "e.g. ![Diagram of the N+1 fix](__INLINE_1__), and matching inlineImagePrompts entries.",
    "Each inlineImagePrompts.prompt must describe a specific visual (diagram, before/after, code card, metaphor).",
  ].join("\n");

  return { system, user };
}

export type LinkedInBlogContext = {
  title: string;
  excerpt: string;
  body: string;
  category: string;
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
    "You rewrite a blog post into one LinkedIn post for Ali Raza / Twixr Solutions.",
    "You MUST call the submit_linkedin_draft tool with the finished post. Do not reply with free-form prose.",
    "",
    absoluteRules(),
    "",
    "VOICE GUIDE:",
    voice,
  ].join("\n");

  const user = [
    "Create a LinkedIn post derived from this blog.",
    "",
    `Title: ${blog.title}`,
    `Category: ${blog.category}`,
    `Excerpt: ${blog.excerpt}`,
    blog.topic ? `Topic: ${blog.topic}` : "",
    `Real example (use only if non-empty): ${blog.realExample || "(none - keep personal angle general)"}`,
    "",
    "Blog body (source material, do not copy wholesale):",
    blog.body.slice(0, 12000),
    "",
    "DO NOT DO:",
    dontDo,
    "",
    "LinkedIn structure:",
    "- Hook (1-2 lines): problem-first",
    "- Body (4-8 short lines): white space, specific tools/patterns",
    "- Personal angle (1 line): general unless a real example exists",
    "- CTA: one easy question",
    "- Hashtags: 4-6 on the last line",
    "- Total post text <= 3000 characters",
    "",
    "OUTPUT: call submit_linkedin_draft with:",
    "{",
    '  "text": "full post including hashtag line",',
    '  "altHooks": ["hook option 2", "hook option 3"],',
    '  "hashtags": ["#Tag1", "#Tag2", "..."]',
    "}",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}
