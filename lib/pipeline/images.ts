import { GoogleGenAI, Modality } from "@google/genai";
import { uploadToCloudinary } from "@/lib/cms/cloudinary";
import { pipeline } from "@/lib/pipeline/config";
import type { BlogDraft } from "@/lib/pipeline/generate-blog";

const MAX_INLINE = 3;

function client(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
}

function extractImageBytes(response: {
  candidates?: Array<{
    content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
  }>;
  data?: string;
}): { bytes: Buffer; mimeType: string } | null {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        bytes: Buffer.from(part.inlineData.data, "base64"),
        mimeType: part.inlineData.mimeType || "image/png",
      };
    }
  }
  if (response.data) {
    return {
      bytes: Buffer.from(response.data, "base64"),
      mimeType: "image/png",
    };
  }
  return null;
}

export async function generateImage(
  prompt: string,
  opts?: { size?: string; filename?: string }
): Promise<string> {
  const ai = client();
  const sizeHint = opts?.size ? ` Target size about ${opts.size}.` : "";
  const response = await ai.models.generateContent({
    model: pipeline.models.image,
    contents: `${prompt}${sizeHint}`,
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  const image = extractImageBytes(response);
  if (!image) {
    throw new Error("Image model returned no image bytes");
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
};

export async function generateInlineImages(
  draft: BlogDraft
): Promise<InlineImageResult> {
  let body = draft.body;
  let generated = 0;
  let failed = 0;
  const urls: string[] = [];
  const prompts = draft.inlineImagePrompts.slice(0, MAX_INLINE);

  for (const item of prompts) {
    try {
      const url = await generateImage(item.prompt, {
        size: "1280x720",
        filename: `inline-${item.placeholder.replace(/_/g, "").toLowerCase()}.png`,
      });
      body = body.replaceAll(item.placeholder, url);
      // also replace markdown that embeds the placeholder as the URL
      const escaped = item.placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      body = body.replace(
        new RegExp(`!\\[([^\\]]*)\\]\\(${escaped}\\)`, "g"),
        `![$1](${url})`
      );
      urls.push(url);
      generated += 1;
    } catch (error) {
      failed += 1;
      console.warn(
        `Inline image failed for ${item.placeholder}:`,
        error instanceof Error ? error.message : error
      );
      const escaped = item.placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      body = body
        .split("\n")
        .filter((line) => !new RegExp(escaped).test(line))
        .join("\n");
    }
  }

  return { body, generated, failed, urls };
}

export async function linkedinImage(topic: string): Promise<string> {
  const prompt = [
    "Create a clean, original square social graphic for a LinkedIn post.",
    `Topic: ${topic}.`,
    "Modern, technical, minimal. Dark ink and pine green accents on a light canvas.",
    "Include a subtle twixrsolutions.com watermark in a corner.",
    "No stock photo look. No third-party logos. No unreadable tiny text.",
  ].join(" ");

  return generateImage(prompt, {
    size: "1080x1080",
    filename: `linkedin-${Date.now()}.png`,
  });
}

export async function aiCoverImage(draft: BlogDraft): Promise<string> {
  const prompt = [
    "Editorial blog cover image, wide 16:9.",
    `Title concept: ${draft.title}.`,
    `Category: ${draft.category}.`,
    draft.coverAlt ? `Visual direction: ${draft.coverAlt}.` : "",
    "No logos. Legible composition. Technical but human.",
  ]
    .filter(Boolean)
    .join(" ");

  return generateImage(prompt, {
    size: "1200x630",
    filename: `cover-${draft.slug || Date.now()}.png`,
  });
}
