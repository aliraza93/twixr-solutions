import Anthropic from "@anthropic-ai/sdk";
import { pipeline } from "@/lib/pipeline/config";
import { parseJsonFromModel } from "@/lib/pipeline/json";
import {
  buildLinkedInPrompt,
  type LinkedInBlogContext,
} from "@/lib/pipeline/prompt";

export type LinkedInDraft = {
  text: string;
  altHooks: string[];
  hashtags: string[];
};

export async function generateLinkedIn(
  blog: LinkedInBlogContext
): Promise<LinkedInDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const { system, user } = buildLinkedInPrompt(blog);
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: pipeline.models.social,
    max_tokens: 2048,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n");

  const draft = parseJsonFromModel<LinkedInDraft>(text);
  return {
    text: String(draft.text ?? "").trim().slice(0, 3000),
    altHooks: Array.isArray(draft.altHooks)
      ? draft.altHooks.map((h) => String(h).trim()).filter(Boolean).slice(0, 3)
      : [],
    hashtags: Array.isArray(draft.hashtags)
      ? draft.hashtags.map((h) => String(h).trim()).filter(Boolean).slice(0, 6)
      : [],
  };
}
