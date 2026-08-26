import Anthropic from "@anthropic-ai/sdk";
import type { Brief } from "@prisma/client";
import { pipeline } from "@/lib/pipeline/config";
import { parseJsonFromModel } from "@/lib/pipeline/json";
import { buildBlogPrompt } from "@/lib/pipeline/prompt";

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
};

export async function generateBlog(brief: Brief): Promise<BlogDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const { system, user } = buildBlogPrompt(brief);
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: pipeline.models.blog,
    max_tokens: 8192,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n");

  const draft = parseJsonFromModel<BlogDraft>(text);
  return normalizeDraft(draft);
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
  };
}
