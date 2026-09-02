import Anthropic from "@anthropic-ai/sdk";
import type { Brief } from "@prisma/client";
import { pipeline } from "@/lib/pipeline/config";
import {
  buildBlogPrompt,
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

export async function generateBlog(
  brief: Brief,
  seo?: BlogPromptSeoContext
): Promise<BlogDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const { system, user } = buildBlogPrompt(brief, seo);
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: pipeline.models.blog,
    max_tokens: 8192,
    system,
    tools: [BLOG_DRAFT_TOOL],
    tool_choice: { type: "tool", name: "submit_blog_draft" },
    messages: [{ role: "user", content: user }],
  });

  const toolBlock = response.content.find(
    (block) => block.type === "tool_use" && block.name === "submit_blog_draft"
  );
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Model did not return a blog draft tool payload");
  }

  return normalizeDraft(toolBlock.input as BlogDraft);
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
          .slice(0, 3)
      : [],
    sources: Array.isArray(raw.sources)
      ? raw.sources.map((s) => String(s).trim()).filter(Boolean)
      : [],
    primaryKeyword: String(raw.primaryKeyword ?? "").trim() || undefined,
    searchIntent: String(raw.searchIntent ?? "").trim() || undefined,
    contentCluster: String(raw.contentCluster ?? "").trim() || undefined,
  };
}
