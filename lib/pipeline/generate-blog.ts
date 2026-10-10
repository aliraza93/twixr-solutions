import Anthropic from "@anthropic-ai/sdk";
import type { Brief } from "@prisma/client";
import { pipeline } from "@/lib/pipeline/config";
import { capsFor } from "@/lib/pipeline/model-capabilities";
import {
  buildBlogPrompt,
  buildSecondPassPrompt,
  type BlogPromptSeoContext,
} from "@/lib/pipeline/prompt";

export type BlogDraft = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  readingTime: string;
  body: string;
  faqs: { question: string; answer: string }[];
  coverAlt: string;
  inlineImagePrompts: { placeholder: string; prompt: string; alt: string }[];
  sources: string[];
  primaryKeyword?: string;
  searchIntent?: string;
  contentCluster?: string;
};

const BLOG_DRAFT_TOOL = {
  name: "submit_blog_draft",
  description: "Submit the finished blog draft as structured fields.",
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    properties: {
      slug: { type: "string" as const },
      title: { type: "string" as const },
      excerpt: { type: "string" as const },
      category: { type: "string" as const },
      tags: { type: "array" as const, items: { type: "string" as const } },
      readingTime: { type: "string" as const },
      body: { type: "string" as const },
      faqs: {
        type: "array" as const,
        items: {
          type: "object" as const,
          additionalProperties: false,
          properties: {
            question: { type: "string" as const },
            answer: { type: "string" as const },
          },
          required: ["question", "answer"],
        },
      },
      coverAlt: { type: "string" as const },
      inlineImagePrompts: {
        type: "array" as const,
        items: {
          type: "object" as const,
          additionalProperties: false,
          properties: {
            placeholder: { type: "string" as const },
            prompt: { type: "string" as const },
            alt: { type: "string" as const },
          },
          required: ["placeholder", "prompt", "alt"],
        },
      },
      sources: { type: "array" as const, items: { type: "string" as const } },
      primaryKeyword: { type: "string" as const },
      searchIntent: { type: "string" as const },
      contentCluster: { type: "string" as const },
    },
    required: [
      "slug",
      "title",
      "excerpt",
      "category",
      "tags",
      "readingTime",
      "body",
      "faqs",
      "coverAlt",
      "inlineImagePrompts",
      "sources",
    ],
  },
};

export type BlogModelOptions = {
  /** Drawn by the variety plan. Falls back to the configured blog model. */
  model?: string;
  /** Null or undefined when the model rejects a non-default temperature. */
  temperature?: number | null;
  /** Null or undefined when the model rejects output_config.effort. */
  effort?: "low" | "medium" | "high" | null;
};

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey });
}

/**
 * One blog-draft call, shaped for whatever model was drawn.
 *
 * Opus 5.5 and Sonnet 5.5 reject forced tool_choice, so those models get
 * `auto` plus the explicit instruction already in the system prompt, and one
 * corrective retry if they answer in prose anyway.
 */
async function callDraftTool(
  system: string,
  messages: Anthropic.MessageParam[],
  opts: BlogModelOptions
): Promise<BlogDraft> {
  const model = opts.model?.trim() || pipeline.models.blog;
  const caps = capsFor(model);

  const params: Anthropic.MessageCreateParamsNonStreaming = {
    model,
    // Generous, because a deep-dive draft plus adaptive thinking on the
    // current-generation models can run long, and a truncated tool call is a
    // lost run.
    max_tokens: 16000,
    system,
    tools: [BLOG_DRAFT_TOOL],
    tool_choice: caps.forcedToolChoice
      ? { type: "tool", name: "submit_blog_draft" }
      : { type: "auto" },
    messages,
  };
  if (caps.temperature && typeof opts.temperature === "number") {
    params.temperature = opts.temperature;
  }
  if (caps.effort && opts.effort) {
    params.output_config = { effort: opts.effort };
  }

  const api = client();
  let response = await api.messages.create(params);
  let toolBlock = response.content.find(
    (block) => block.type === "tool_use" && block.name === "submit_blog_draft"
  );

  if (!toolBlock && !caps.forcedToolChoice) {
    // The model answered in prose. Ask once more, naming the tool.
    response = await api.messages.create({
      ...params,
      messages: [
        ...messages,
        { role: "assistant", content: response.content },
        {
          role: "user",
          content:
            "You replied with prose. Call the submit_blog_draft tool now with the finished draft. Do not reply with text.",
        },
      ],
    });
    toolBlock = response.content.find(
      (block) => block.type === "tool_use" && block.name === "submit_blog_draft"
    );
  }

  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error(
      `Model did not return a blog draft tool payload (model=${model}, stop_reason=${response.stop_reason})`
    );
  }

  return normalizeDraft(toolBlock.input as BlogDraft);
}

export async function generateBlog(
  brief: Brief,
  seo?: BlogPromptSeoContext,
  opts: BlogModelOptions = {}
): Promise<BlogDraft> {
  const { system, user } = buildBlogPrompt(brief, seo);
  return callDraftTool(system, [{ role: "user", content: user }], opts);
}

/**
 * Optional second pass: hand the draft back and ask for a tightening edit.
 *
 * This is one of the strongest texture levers available. A first draft from a
 * fixed prompt has a recognisable rhythm; a draft that has been cut by 15
 * percent and had its opening rewritten does not. Runs on a drawn fraction of
 * posts, so the feed contains both.
 */
export async function reviseBlogDraft(
  brief: Brief,
  draft: BlogDraft,
  seo?: BlogPromptSeoContext,
  opts: BlogModelOptions = {}
): Promise<BlogDraft> {
  const { system, user } = buildSecondPassPrompt(brief, draft, seo);
  return callDraftTool(system, [{ role: "user", content: user }], opts);
}

function normalizeDraft(raw: BlogDraft): BlogDraft {
  return {
    slug: String(raw.slug ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    title: String(raw.title ?? "").trim(),
    excerpt: String(raw.excerpt ?? "").trim().slice(0, 160),
    category: String(raw.category ?? "").trim(),
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 6)
      : [],
    readingTime: String(raw.readingTime ?? "5 min read").trim(),
    body: String(raw.body ?? "").trim(),
    faqs: Array.isArray(raw.faqs)
      ? raw.faqs
          .map((f) => ({
            question: String(f?.question ?? "").trim(),
            answer: String(f?.answer ?? "").trim(),
          }))
          .filter((f) => f.question && f.answer)
          .slice(0, 5)
      : [],
    coverAlt: String(raw.coverAlt ?? "").trim(),
    inlineImagePrompts: Array.isArray(raw.inlineImagePrompts)
      ? raw.inlineImagePrompts
          .map((p, i) => ({
            placeholder: String(p?.placeholder ?? `__INLINE_${i + 1}__`).trim(),
            prompt: String(p?.prompt ?? "").trim(),
            alt: String(p?.alt ?? "").trim(),
          }))
          .filter((p) => p.prompt)
          .slice(0, 4)
      : [],
    sources: Array.isArray(raw.sources)
      ? raw.sources.map((s) => String(s).trim()).filter(Boolean)
      : [],
    primaryKeyword: String(raw.primaryKeyword ?? "").trim() || undefined,
    searchIntent: String(raw.searchIntent ?? "").trim() || undefined,
    contentCluster: String(raw.contentCluster ?? "").trim() || undefined,
  };
}
