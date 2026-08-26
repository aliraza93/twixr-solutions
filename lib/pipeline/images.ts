import { randomInt } from "node:crypto";
import { GoogleGenAI, Modality } from "@google/genai";
import { uploadToCloudinary } from "@/lib/cms/cloudinary";
import {
  BRAND_STYLES,
  pickBrandStyle,
  type BrandStyle,
} from "@/lib/pipeline/brand-styles";
import { pipeline } from "@/lib/pipeline/config";
import type { BlogDraft } from "@/lib/pipeline/generate-blog";

const MAX_INLINE = 3;
const MIN_INLINE = 2;

const INLINE_KINDS = [
  "architecture or data-flow diagram with clear labeled boxes and arrows",
  "before/after comparison panel (two panels, minimal labels)",
  "abstract technical metaphor illustration (no people, no logos)",
  "clean checklist or decision-tree visual",
  "code-window style graphic with large readable snippets (6-10 lines max)",
] as const;

function client(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
}

type InlinePart = {
  inlineData?: { data?: string; mimeType?: string };
  inline_data?: { data?: string; mime_type?: string; mimeType?: string };
};

function partsFromResponse(response: unknown): InlinePart[] {
  if (!response || typeof response !== "object") return [];
  const r = response as {
    parts?: InlinePart[];
    candidates?: Array<{ content?: { parts?: InlinePart[] } }>;
    data?: string;
  };
  if (Array.isArray(r.parts) && r.parts.length) return r.parts;
  const candidateParts = r.candidates?.[0]?.content?.parts;
  if (Array.isArray(candidateParts)) return candidateParts;
  return [];
}

function extractImageBytes(response: unknown): {
  bytes: Buffer;
  mimeType: string;
} | null {
  for (const part of partsFromResponse(response)) {
    const data = part.inlineData?.data ?? part.inline_data?.data;
    const mimeType =
      part.inlineData?.mimeType ??
      part.inline_data?.mimeType ??
      part.inline_data?.mime_type ??
      "image/png";
    if (data) {
      return { bytes: Buffer.from(data, "base64"), mimeType };
    }
  }

  const r = response as { data?: string } | null;
  if (r?.data) {
    return { bytes: Buffer.from(r.data, "base64"), mimeType: "image/png" };
  }
  return null;
}

function withBrandStyle(prompt: string, style: BrandStyle): string {
  return [
    prompt.trim(),
    "",
    `Brand style (${style.label}): ${style.aiPrompt}`,
    "Colors: pine #0f5132, lime #bef03a, ink #0b0f0d.",
    "Do not render long paragraphs of text. Short labels only if needed.",
    "No third-party logos. No stock-photo people.",
  ].join("\n");
}

function nextStyle(exclude: string[] = []): BrandStyle {
  const pool = BRAND_STYLES.filter((s) => !exclude.includes(s.id));
  const choices = pool.length ? pool : BRAND_STYLES;
  return choices[randomInt(choices.length)];
}

export async function generateImage(
  prompt: string,
  opts?: { size?: string; filename?: string; style?: BrandStyle }
): Promise<string> {
  const style = opts?.style ?? pickBrandStyle();
  const ai = client();
  const sizeHint = opts?.size ? ` Target size about ${opts.size}.` : "";
  const response = await ai.models.generateContent({
    model: pipeline.models.image,
    contents: `${withBrandStyle(prompt, style)}${sizeHint}`,
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  const image = extractImageBytes(response);
  if (!image) {
    const preview = JSON.stringify(response)?.slice(0, 400) ?? "empty";
    throw new Error(
      `Image model returned no image bytes (model=${pipeline.models.image}). Response preview: ${preview}`
    );
  }

  const ext = image.mimeType.includes("jpeg") ? "jpg" : "png";
  const file = new File(
    [new Uint8Array(image.bytes)],
    opts?.filename ?? `pipeline-${Date.now()}.${ext}`,
    { type: image.mimeType }
  );
  const uploaded = await uploadToCloudinary(file);
  return uploaded.url;
}

export type InlineImageResult = {
  body: string;
  generated: number;
  failed: number;
  urls: string[];
  styleIds: string[];
  errors: string[];
};

function ensureInlinePlaceholders(draft: BlogDraft): BlogDraft {
  const prompts = [...draft.inlineImagePrompts];
  while (prompts.length < MIN_INLINE) {
    const n = prompts.length + 1;
    const kind = INLINE_KINDS[(n - 1) % INLINE_KINDS.length];
    prompts.push({
      placeholder: `__INLINE_${n}__`,
      prompt: `${kind} about: ${draft.title}. ${draft.coverAlt || draft.excerpt}`,
      alt: `${draft.title} visual ${n}`,
    });
  }

  let body = draft.body;
  for (const item of prompts.slice(0, MAX_INLINE)) {
    if (!body.includes(item.placeholder)) {
      body = `${body.trim()}\n\n![${item.alt}](${item.placeholder})\n`;
    }
  }

  return { ...draft, body, inlineImagePrompts: prompts.slice(0, MAX_INLINE) };
}

export async function generateInlineImages(
  draft: BlogDraft
): Promise<InlineImageResult> {
  const prepared = ensureInlinePlaceholders(draft);
  let body = prepared.body;
  let generated = 0;
  let failed = 0;
  const urls: string[] = [];
  const styleIds: string[] = [];
  const errors: string[] = [];
  const prompts = prepared.inlineImagePrompts.slice(0, MAX_INLINE);
  const usedStyles: string[] = [];

  for (const item of prompts) {
    const style = nextStyle(usedStyles);
    usedStyles.push(style.id);
    styleIds.push(style.id);
    try {
      const url = await generateImage(item.prompt, {
        size: "1280x720",
        filename: `inline-${item.placeholder.replace(/_/g, "").toLowerCase()}-${style.id}.png`,
        style,
      });
      body = body.replaceAll(item.placeholder, url);
      const escaped = item.placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      body = body.replace(
        new RegExp(`!\\[([^\\]]*)\\]\\(${escaped}\\)`, "g"),
        `![$1](${url})`
      );
      urls.push(url);
      generated += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${item.placeholder}: ${message}`);
      console.warn(`Inline image failed for ${item.placeholder}:`, message);
      const escaped = item.placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      body = body
        .split("\n")
        .filter((line) => !new RegExp(escaped).test(line))
        .join("\n");
    }
  }

  return { body, generated, failed, urls, styleIds, errors };
}

export async function linkedinImage(topic: string): Promise<{
  url: string;
  styleId: string;
}> {
  const style = pickBrandStyle();
  const prompt = [
    "Create a clean, original square social graphic for a LinkedIn post.",
    `Topic: ${topic}.`,
    "Composition should read clearly at phone size.",
  ].join(" ");

  const url = await generateImage(prompt, {
    size: "1080x1080",
    filename: `linkedin-${Date.now()}-${style.id}.png`,
    style,
  });
  return { url, styleId: style.id };
}

export async function aiCoverImage(draft: BlogDraft): Promise<{
  url: string;
  styleId: string;
}> {
  const style = pickBrandStyle();
  const prompt = [
    "Editorial blog cover image, wide 16:9, premium technical publication quality.",
    `Title concept: ${draft.title}.`,
    `Category: ${draft.category}.`,
    draft.coverAlt ? `Visual direction: ${draft.coverAlt}.` : "",
    "Strong visual metaphor. Do not paint the full title as small text.",
    "Large shapes, atmospheric lighting, magazine-quality composition.",
  ]
    .filter(Boolean)
    .join(" ");

  const url = await generateImage(prompt, {
    size: "1200x630",
    filename: `cover-${draft.slug || Date.now()}-${style.id}.png`,
    style,
  });
  return { url, styleId: style.id };
}
