import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Brief } from "@prisma/client";
import { BANNED_PHRASES } from "@/content/pipeline/banned-phrases";
import type { BlogDraft } from "@/lib/pipeline/generate-blog";
import type { DepthGuidance } from "@/lib/pipeline/seo/depth";
import { formatDepthGuidanceForPrompt } from "@/lib/pipeline/seo/depth";
import {
  formatNewsGuidanceForPrompt,
  formatVoicePolishForPrompt,
} from "@/lib/pipeline/seo/editorial";
import { formatRotationForPrompt } from "@/lib/pipeline/seo/formats";
import type { RecommendedInternalLink } from "@/lib/pipeline/seo/types";
import { formatLinkPlanForPrompt } from "@/lib/pipeline/seo/internal-links";
import type { VarietyPlan } from "@/lib/pipeline/variety/plan";

export function readKb(name: string): string {
  const file = name.endsWith(".md") ? name : `${name}.md`;
  return readFileSync(join(process.cwd(), "content/pipeline", file), "utf8");
}

function absoluteRules(plan?: VarietyPlan): string {
  const openers = plan?.bannedOpeners ?? [];
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
    openers.length
      ? `7. Do not open with any of these shapes: ${openers.join(" / ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** The run's drawn shape, as instructions. */
function structureBlock(plan: VarietyPlan): string {
  const c = plan.components;
  const optional = [
    c.faq
      ? "Include 3 to 5 structured FAQs."
      : "Do NOT include FAQs this time. Answer the obvious questions inside the body instead.",
    c.takeaways ? "Open or close with a short key-takeaways block." : "",
    c.comparisonTable
      ? "Include one markdown comparison table that earns its place."
      : "Do not use a table.",
    c.checklist ? "Include one scannable checklist or numbered list." : "",
    c.codeBlocks > 0
      ? `Include about ${c.codeBlocks} code block(s), each one short and real.`
      : "Include no code blocks at all. Describe mechanics in prose.",
    c.pullQuote ? "Include one pulled-out line as a blockquote." : "",
    c.productionNotes
      ? "Include a short section on what breaks in production."
      : "",
    c.sourcesSection ? "Include a short visible sources list at the end." : "",
  ].filter(Boolean);

  return [
    "STRUCTURE PLAN FOR THIS POST (follow it - it is different every time on purpose):",
    `Skeleton: ${plan.structure.label}`,
    ...plan.structure.shape.map((line) => `- ${line}`),
    plan.structure.sectionsMax === 0
      ? "- Use no headings."
      : `- Use about ${plan.sectionCount} section heading(s). Not more.`,
    plan.structure.ownEnding
      ? "- This skeleton carries its own ending. Do not add a generic conclusion or summary section."
      : "",
    "",
    `Word target: about ${plan.wordTarget} words (acceptable range ${plan.wordTargetMin} to ${plan.wordTargetMax}).`,
    "Hit it by covering the right amount, never by padding. If you are repeating yourself, stop early.",
    "",
    `Opening: ${plan.openingDevice.instruction}`,
    `Title shape: ${plan.titlePattern.instruction}`,
    `Headings: ${plan.headingStyle.instruction}`,
    `Sentence rhythm: ${plan.rhythm.instruction}`,
    `Point of view: ${plan.person.instruction}`,
    `Ending: ${plan.components.ctaShape.instruction}`,
    "",
    "COMPONENTS FOR THIS POST:",
    ...optional.map((line) => `- ${line}`),
  ]
    .filter(Boolean)
    .join("\n");
}

/** The run's drawn angle: who it is for and what is at stake. */
function angleBlock(plan: VarietyPlan): string {
  return [
    "ANGLE FOR THIS POST:",
    `Reader: ${plan.audience.instruction}`,
    `Lens: ${plan.lens.instruction}`,
    `Stakes: ${plan.stake.instruction}`,
    "Write as if this specific reader, with this specific thing at risk, is the only person who will read it.",
    "Do not name the lens or the stake explicitly. Let them shape what you choose to cover.",
  ].join("\n");
}

/** The run's drawn writing style. */
function styleBlock(plan: VarietyPlan): string {
  return [
    `STYLEBOOK FOR THIS POST (${plan.stylebook.label}):`,
    ...plan.stylebook.rules.map((r) => `- ${r}`),
    "",
    "ADDITIONAL CONSTRAINTS FOR THIS POST ONLY:",
    ...plan.quirks.map((q) => `- ${q}`),
  ].join("\n");
}

function imageInstructions(plan?: VarietyPlan): string {
  if (!plan) {
    return [
      "INLINE IMAGES: 2 or 3 for this post.",
      "Place them in the body on their own lines as ![alt](__INLINE_1__), with matching inlineImagePrompts entries.",
      "Each prompt must describe a specific visual (diagram, before/after, code card, metaphor).",
    ].join("\n");
  }
  const n = plan.images.inlineCount;
  if (n === 0) {
    return [
      "INLINE IMAGES: none for this post.",
      "Return an empty inlineImagePrompts array and put no image placeholders in the body.",
    ].join("\n");
  }
  return [
    `INLINE IMAGES: exactly ${n} for this post.`,
    `Place ${n} placeholder(s) in the body on their own lines, as ![alt](__INLINE_1__) through ![alt](__INLINE_${n}__).`,
    "Each one goes where it genuinely helps, not bunched at the end.",
    "Matching inlineImagePrompts entries are required, one per placeholder.",
    "Use these visual kinds, in order, one per image:",
    ...plan.images.kinds
      .slice(0, n)
      .map((k, i) => `  __INLINE_${i + 1}__: ${k.prompt}`),
    "Each prompt must describe a specific visual, not a topic restatement.",
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
  /** The run's randomized editorial plan. */
  plan?: VarietyPlan;
  /** Real first-hand material the model is allowed to draw on. */
  receipts?: string;
};

export function buildBlogPrompt(
  brief: Brief,
  seo?: BlogPromptSeoContext
): { system: string; user: string } {
  const plan = seo?.plan;
  const voice = readKb("voice-guide");
  const pillars = readKb("content-pillars");
  const dontDo = readKb("dont-do");
  const codeCard = readKb("code-card-style");
  // Including the swipe file on only some runs is itself a variety lever: it
  // nudges structure, so loading it every time flattens output toward it.
  const swipe = !plan || plan.includeSwipeFile ? readKb("swipe-file") : "";

  const system = [
    "You draft one long-form blog post for Twixr Solutions / Ali Raza.",
    "You MUST call the submit_blog_draft tool with the finished draft. Do not reply with free-form prose.",
    "",
    absoluteRules(plan),
    "",
    "VOICE GUIDE:",
    voice,
  ].join("\n");

  const keyword = seo?.primaryKeyword || brief.targetKeyword || brief.topic;
  const cluster =
    seo?.contentCluster || brief.pillar.split("/")[1]?.trim() || brief.pillar;
  const intent =
    seo?.searchIntent ||
    (brief.requiresLiveSource
      ? "Explain what this news changes for engineers who ship, with verified facts only."
      : "Help a peer engineer solve a concrete technical or business problem.");

  const linkBlock = formatLinkPlanForPrompt(seo?.recommendedInternalLinks ?? []);
  const depth = seo?.depth;
  const newsBlock = formatNewsGuidanceForPrompt({
    requiresLiveSource: brief.requiresLiveSource,
    evergreenLinks: seo?.recommendedInternalLinks ?? [],
  });

  // Guidance blocks are emitted in a shuffled order. Models are sensitive to
  // ordering, so permuting the same instructions measurably diversifies output
  // without changing a single rule.
  const blocks: Record<string, string> = {
    voice: formatVoicePolishForPrompt(),
    structure: plan ? structureBlock(plan) : "",
    angle: plan ? angleBlock(plan) : "",
    depth: depth ? formatDepthGuidanceForPrompt(depth) : "",
    format: plan
      ? formatRotationForPrompt(plan.format)
      : depth
        ? formatRotationForPrompt(depth.format)
        : "",
    pillars: ["CONTENT PILLARS:", pillars].join("\n"),
  };
  const order = plan?.blockOrder ?? Object.keys(blocks);
  const orderedBlocks = order
    .map((key) => blocks[key])
    .filter((b): b is string => Boolean(b && b.trim()));

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
            (brief as Brief & { extraInstructions?: string })
              .extraInstructions ||
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
    seo?.receipts || "",
    "",
    ...orderedBlocks,
    "",
    plan ? styleBlock(plan) : "",
    "",
    newsBlock,
    sourceBlock,
    adminBlock,
    "",
    linkBlock,
    seo?.gapContext || "",
    "",
    "DO NOT DO:",
    dontDo,
    "",
    "CODE CARD STYLE (for code-tip imagery prompts):",
    codeCard,
    swipe ? "\nSWIPE / STRUCTURE HINTS:" : "",
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
    '  "faqs": [{"question":"...","answer":"..."}],',
    '  "coverAlt": "descriptive alt, no keyword stuffing (e.g. Laravel queue worker and job flow)",',
    '  "inlineImagePrompts": [{"placeholder":"__INLINE_1__","prompt":"...","alt":"..."}],',
    '  "sources": ["https://..."],',
    '  "primaryKeyword": "string",',
    '  "searchIntent": "one sentence",',
    '  "contentCluster": "short cluster label"',
    "}",
    "",
    "Body rules: markdown only. Prefer structured faqs over a ## FAQ section.",
    "Sell the outcome, not the stack. Follow the structure plan above for the opening.",
    imageInstructions(plan),
    "When using internal links, write them as markdown [anchor](absolute-url) using only allowed URLs.",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

/**
 * The tightening pass. Runs on a drawn fraction of posts.
 *
 * Asking for a real edit rather than a rewrite is the point: the result keeps
 * the substance but loses the uniform first-draft cadence that makes generated
 * prose recognisable.
 */
export function buildSecondPassPrompt(
  brief: Brief,
  draft: BlogDraft,
  seo?: BlogPromptSeoContext
): { system: string; user: string } {
  const plan = seo?.plan;
  const voice = readKb("voice-guide");

  const system = [
    "You are editing your own draft before publication. You are a hard editor, not a rewriter.",
    "You MUST call the submit_blog_draft tool with the edited draft. Do not reply with free-form prose.",
    "",
    absoluteRules(plan),
    "",
    "VOICE GUIDE:",
    voice,
  ].join("\n");

  const user = [
    "Edit this draft. Keep the substance, the structure, and every factual claim. Improve the prose.",
    "",
    "DO THIS:",
    "- Cut about 15 percent. Remove any sentence that only sets up another sentence.",
    "- Rewrite the opening two lines so they are sharper and more specific.",
    "- Break up any paragraph that reads as uniform in length with its neighbours.",
    "- Replace any abstract noun phrase with the concrete thing it refers to.",
    "- Delete transition words that carry no meaning: moreover, furthermore, additionally, in conclusion.",
    "- Keep every heading, image placeholder, internal link, FAQ, and source exactly as they are.",
    plan ? `- Keep the point of view: ${plan.person.instruction}` : "",
    "",
    "DO NOT:",
    "- Do not add new claims, numbers, examples, or sources.",
    "- Do not change the slug or the image placeholders.",
    "- Do not make it longer.",
    "",
    `Topic for context: ${brief.topic}`,
    "",
    "CURRENT DRAFT (JSON):",
    JSON.stringify(
      {
        slug: draft.slug,
        title: draft.title,
        excerpt: draft.excerpt,
        category: draft.category,
        tags: draft.tags,
        readingTime: draft.readingTime,
        body: draft.body,
        faqs: draft.faqs,
        coverAlt: draft.coverAlt,
        inlineImagePrompts: draft.inlineImagePrompts,
        sources: draft.sources,
        primaryKeyword: draft.primaryKeyword,
        searchIntent: draft.searchIntent,
        contentCluster: draft.contentCluster,
      },
      null,
      2
    ),
    "",
    "Call submit_blog_draft with the full edited draft, all fields present.",
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
  /** The run's randomized social plan. */
  plan?: VarietyPlan;
};

export function buildLinkedInPrompt(blog: LinkedInBlogContext): {
  system: string;
  user: string;
} {
  const plan = blog.plan;
  const voice = readKb("voice-guide");
  const dontDo = readKb("dont-do");
  const shape = plan?.social.shape;
  const band = plan?.social.lengthBand;
  const tagCount = plan?.social.hashtagCount;

  const system = [
    "You are Ali Raza writing your own LinkedIn post. First person. Not a brand account, not a generic ghostwriter voice.",
    "Turn ONE idea from the blog into a single scroll-stopping post for engineers, founders, and CTOs.",
    "You MUST call the submit_linkedin_draft tool with the finished post. Do not reply with free-form prose.",
    "",
    absoluteRules(plan),
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
    `Blog URL (must appear once, on its own line before any hashtags): ${blog.blogUrl}`,
    "",
    "Source material (for grounding only - do not outline it or paste sections):",
    blog.excerpt,
    "",
    blog.body.slice(0, 3000),
    "",
    "DO NOT DO:",
    dontDo,
    "",
    shape
      ? [
          "POST SHAPE FOR TODAY (different every time on purpose):",
          shape.instruction,
          "Do not fall back on the generic hook / body / personal / CTA template. This shape replaces it.",
        ].join("\n")
      : [
          "STRUCTURE:",
          "- HOOK (line 1, at most 2 lines): open on a specific pain, tension, or claim the reader already feels.",
          "- BODY (3 to 6 short lines): one idea per line, blank line between thoughts.",
          "- PERSONAL ANGLE (1 line): a real, first-person builder's take.",
          "- CTA (1 line): one genuine, specific question that invites a real reply.",
        ].join("\n"),
    "",
    plan
      ? `Opening: ${plan.openingDevice.instruction}`
      : "",
    band
      ? `LENGTH: aim for ${band.min} to ${band.max} characters. Hard max 3000.`
      : "LENGTH: aim for 700 to 1300 characters. Hard max 3000.",
    tagCount !== undefined
      ? tagCount === 0
        ? "HASHTAGS: none at all this time. Do not add a hashtag line."
        : `HASHTAGS: exactly ${tagCount}, on the final line, mixing broad and specific. No hashtag walls.`
      : "HASHTAGS: 4 to 5 on the final line.",
    `LINK: a line reading exactly - Full write-up: ${blog.blogUrl}`,
    "TONE: first person, senior, dry confidence, near-zero emojis (prefer none). Sell the outcome; the tech is proof lower down.",
    "",
    "OUTPUT: call submit_linkedin_draft with:",
    "{",
    '  "text": "the full post including the blog URL line and any hashtag line",',
    '  "altHooks": ["a genuinely different angle hook", "a third angle hook"],',
    `  "hashtags": [${tagCount === 0 ? "" : '"#Tag1", "#Tag2"'}]`,
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
  plan?: VarietyPlan;
};

export function buildXPrompt(blog: XBlogContext): {
  system: string;
  user: string;
} {
  const dontDo = readKb("dont-do");
  const plan = blog.plan;

  const system = [
    "You write one short X (Twitter) post for Ali Raza / Twixr Solutions.",
    "You MUST call the submit_x_draft tool. Do not reply with free-form prose.",
    "",
    absoluteRules(plan),
    "7. Hard max 280 characters for the full post text (X counts URLs as 23 chars).",
    "8. Punchy feed post: hook + one tip. Not a LinkedIn essay. Not a thread.",
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
    plan ? `- ${plan.openingDevice.instruction}` : "",
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
