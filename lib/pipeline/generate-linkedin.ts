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
    text: String(draft.text ?? "").trim().slice(0, 3000),
    altHooks: Array.isArray(draft.altHooks)
      ? draft.altHooks.map((h) => String(h).trim()).filter(Boolean).slice(0, 3)
      : [],
    hashtags: Array.isArray(draft.hashtags)
      ? draft.hashtags.map((h) => String(h).trim()).filter(Boolean).slice(0, 6)
      : [],
  };
}
