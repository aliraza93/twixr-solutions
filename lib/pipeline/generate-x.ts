import Anthropic from "@anthropic-ai/sdk";
import { pipeline } from "@/lib/pipeline/config";
import { buildXPrompt, type XBlogContext } from "@/lib/pipeline/prompt";

export type XDraft = {
  text: string;
  altHooks: string[];
};

/** X treats each URL as 23 characters regardless of length. */
export function xWeightedLength(text: string): number {
  const urlRe = /https?:\/\/[^\s]+/gi;
  let length = text.length;
  const matches = text.match(urlRe) ?? [];
  for (const url of matches) {
    length = length - url.length + 23;
  }
  return length;
}

/** Ensure URL is present and weighted length <= 280. */
export function ensureXPost(text: string, blogUrl: string): string {
  let out = text.trim();
  if (blogUrl && !out.includes(blogUrl)) {
    out = `${out}\n\n${blogUrl}`.trim();
  }

  if (xWeightedLength(out) <= 280) return out;

  // Drop hashtags first, then trim body before URL.
  const withoutTags = out
    .split("\n")
    .filter((line) => !/^#[\w]+(\s+#[\w]+)*\s*$/.test(line.trim()))
    .join("\n")
    .trim();
  out = withoutTags.includes(blogUrl)
    ? withoutTags
    : `${withoutTags}\n\n${blogUrl}`.trim();

  if (xWeightedLength(out) <= 280) return out;

  const urlBlock = `\n\n${blogUrl}`;
  const budget = 280 - 23; // URL weighs 23
  const body = out.replace(blogUrl, "").trim().slice(0, budget);
  const clipped = body.replace(/\s+\S*$/, "").trimEnd();
  return `${clipped}${urlBlock}`.trim();
}

const X_DRAFT_TOOL = {
  name: "submit_x_draft",
  description: "Submit the finished X (Twitter) post as structured fields.",
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    properties: {
      text: { type: "string" as const },
      altHooks: { type: "array" as const, items: { type: "string" as const } },
    },
    required: ["text", "altHooks"],
  },
};

export async function generateX(blog: XBlogContext): Promise<XDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const { system, user } = buildXPrompt(blog);
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: pipeline.models.social,
    max_tokens: 1024,
    system,
    tools: [X_DRAFT_TOOL],
    tool_choice: { type: "tool", name: "submit_x_draft" },
    messages: [{ role: "user", content: user }],
  });

  const toolBlock = response.content.find(
    (block) => block.type === "tool_use" && block.name === "submit_x_draft"
  );
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Model did not return an X draft tool payload");
  }

  const draft = toolBlock.input as XDraft;
  return {
    text: ensureXPost(String(draft.text ?? "").trim(), blog.blogUrl),
    altHooks: Array.isArray(draft.altHooks)
      ? draft.altHooks.map((h) => String(h).trim()).filter(Boolean).slice(0, 3)
      : [],
  };
}
