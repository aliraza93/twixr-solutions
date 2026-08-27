import Anthropic from "@anthropic-ai/sdk";
import { pipeline } from "@/lib/pipeline/config";
import {
  buildLinkedInPrompt,
  type LinkedInBlogContext,
} from "@/lib/pipeline/prompt";

export type LinkedInDraft = {
  text: string;
  altHooks: string[];
  hashtags: string[];
};

/** Guarantee the Twixr blog URL sits before the hashtag line. */
export function ensureLinkedInBlogLink(text: string, blogUrl: string): string {
  const trimmed = text.trim();
  if (!blogUrl || trimmed.includes(blogUrl)) {
    return trimmed.slice(0, 3000);
  }

  const lines = trimmed.split("\n");
  let lastIdx = lines.length - 1;
  while (lastIdx >= 0 && !lines[lastIdx].trim()) lastIdx--;

  const last = lastIdx >= 0 ? lines[lastIdx].trim() : "";
  const tagCount = (last.match(/#[\w]+/g) ?? []).length;
  const hashtagLine = tagCount >= 4 ? last : null;

  const suffix = hashtagLine
    ? `\n\nFull write-up: ${blogUrl}\n\n${hashtagLine}`
    : `\n\nFull write-up: ${blogUrl}`;

  const body = hashtagLine
    ? lines.slice(0, lastIdx).join("\n").replace(/\s+$/, "")
    : trimmed;

  const maxBody = Math.max(0, 3000 - suffix.length);
  const clipped =
    body.length > maxBody
      ? body.slice(0, maxBody).replace(/\s+\S*$/, "").trimEnd()
      : body;

  return `${clipped}${suffix}`;
}

const LINKEDIN_DRAFT_TOOL = {
  name: "submit_linkedin_draft",
  description: "Submit the finished LinkedIn post as structured fields.",
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    properties: {
      text: { type: "string" as const },
      altHooks: { type: "array" as const, items: { type: "string" as const } },
      hashtags: { type: "array" as const, items: { type: "string" as const } },
    },
    required: ["text", "altHooks", "hashtags"],
  },
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
    tools: [LINKEDIN_DRAFT_TOOL],
    tool_choice: { type: "tool", name: "submit_linkedin_draft" },
    messages: [{ role: "user", content: user }],
  });

  const toolBlock = response.content.find(
    (block) =>
      block.type === "tool_use" && block.name === "submit_linkedin_draft"
  );
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Model did not return a LinkedIn draft tool payload");
  }

  const draft = toolBlock.input as LinkedInDraft;
  return {
    text: ensureLinkedInBlogLink(
      String(draft.text ?? "").trim(),
      blog.blogUrl
    ),
    altHooks: Array.isArray(draft.altHooks)
      ? draft.altHooks.map((h) => String(h).trim()).filter(Boolean).slice(0, 3)
      : [],
    hashtags: Array.isArray(draft.hashtags)
      ? draft.hashtags.map((h) => String(h).trim()).filter(Boolean).slice(0, 6)
      : [],
  };
}
