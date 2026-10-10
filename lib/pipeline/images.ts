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
import { seoImageFilename } from "@/lib/pipeline/seo/image-hygiene";
import { renderLinkedInCard } from "@/lib/pipeline/og-cover";
import { INLINE_IMAGE_KINDS, RENDER_MODIFIERS } from "@/lib/pipeline/variety/banks";
import type { VarietyPlan } from "@/lib/pipeline/variety/plan";
import sharp from "sharp";

/** Hard ceiling. The per-run count is drawn by the variety plan. */
const MAX_INLINE = 4;

const INLINE_KINDS = INLINE_IMAGE_KINDS.map((k) => k.prompt);

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

/**
 * Palette crossed with a render modifier.
 *
 * 24 palettes on their own repeat visibly within a couple of months. Crossing
 * them with 10 rendering styles gives 240 distinct looks from two small banks,
 * so a reader scrolling the archive does not see one house style.
 */
function withBrandStyle(
  prompt: string,
  style: BrandStyle,
  modifier?: { id: string; prompt: string }
): string {
  const { background, accent, ink, muted, panel } = style.og;
  return [
    prompt.trim(),
    "",
    `Visual direction: ${style.aiPrompt}`,
    modifier ? `Rendering style: ${modifier.prompt}` : "",
    `Colors for this image only: background ${background}, accent ${accent}, ink ${ink}, muted ${muted}, panel ${panel}.`,
    "Match these hexes. Do not use other palettes.",
    "Never paint style names, palette names, hex codes, or the words Brand style onto the image.",
    "No third-party logos. No stock-photo people.",
  ]
    .filter(Boolean)
    .join("\n");
}

function nextStyle(exclude: string[] = []): BrandStyle {
  const pool = BRAND_STYLES.filter((s) => !exclude.includes(s.id));
  const choices = pool.length ? pool : BRAND_STYLES;
  return choices[randomInt(choices.length)];
}

/**
 * Re-encode raw model output so the C2PA "Content Credentials" provenance
 * manifest (and any EXIF/XMP metadata Gemini embeds) is dropped. sharp does not
 * copy input metadata to the output unless withMetadata() is called, so a plain
 * re-encode removes the AI-provenance tag that platforms like LinkedIn surface
 * on the image. Falls back to the original bytes if sharp is unavailable, so it
 * can never break a run.
 */
export async function stripImageMetadata(
  bytes: Buffer,
  mimeType: string
): Promise<{ bytes: Buffer; mimeType: string }> {
  try {
    const isJpeg = mimeType.includes("jpeg") || mimeType.includes("jpg");
    const base = sharp(bytes).rotate(); // bake in EXIF orientation, then drop it
    const out = isJpeg
      ? await base.jpeg({ quality: 90 }).toBuffer()
      : await base.png({ compressionLevel: 9 }).toBuffer();
    return { bytes: out, mimeType: isJpeg ? "image/jpeg" : "image/png" };
  } catch (error) {
    console.warn(
      "stripImageMetadata failed, using original bytes:",
      error instanceof Error ? error.message : String(error)
    );
    return { bytes, mimeType };
  }
}

/** Generate raw (metadata-stripped) image bytes from the model, without uploading. */
export async function renderImageBytes(
  prompt: string,
  opts?: {
    size?: string;
    style?: BrandStyle;
    modifier?: { id: string; prompt: string };
  }
): Promise<{ bytes: Buffer; mimeType: string }> {
  const style = opts?.style ?? pickBrandStyle();
  const ai = client();
  const sizeHint = opts?.size ? ` Target size about ${opts.size}.` : "";
  const response = await ai.models.generateContent({
    model: pipeline.models.image,
    contents: `${withBrandStyle(prompt, style, opts?.modifier)}${sizeHint}`,
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

  return stripImageMetadata(image.bytes, image.mimeType);
}

export async function generateImage(
  prompt: string,
  opts?: {
    size?: string;
    filename?: string;
    style?: BrandStyle;
    modifier?: { id: string; prompt: string };
  }
): Promise<string> {
  const { bytes, mimeType } = await renderImageBytes(prompt, {
    size: opts?.size,
    style: opts?.style,
    modifier: opts?.modifier,
  });

  const ext = mimeType.includes("jpeg") ? "jpg" : "png";
  const file = new File(
    [new Uint8Array(bytes)],
    opts?.filename ?? `pipeline-${Date.now()}.${ext}`,
    { type: mimeType }
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

/**
 * Reconcile the draft's placeholders with the drawn image count.
 *
 * The count comes from the variety plan, so a post can legitimately have zero
 * inline images. When the model returned fewer placeholders than were asked
 * for, the missing ones are synthesized from the planned visual kinds; when it
 * returned more, the extras are dropped along with their body references.
 */
function ensureInlinePlaceholders(
  draft: BlogDraft,
  target: number,
  kinds: string[]
): BlogDraft {
  const capped = Math.max(0, Math.min(target, MAX_INLINE));
  const prompts = draft.inlineImagePrompts.slice(0, capped);

  while (prompts.length < capped) {
    const n = prompts.length + 1;
    const kind = kinds[n - 1] ?? INLINE_KINDS[(n - 1) % INLINE_KINDS.length];
    prompts.push({
      placeholder: `__INLINE_${n}__`,
      prompt: `${kind} about: ${draft.title}. ${draft.coverAlt || draft.excerpt}`,
      alt: `${draft.title} visual ${n}`,
    });
  }

  let body = draft.body;

  // Drop any placeholder the plan no longer wants, so no literal __INLINE_n__
  // can survive into the published body.
  const keep = new Set(prompts.map((p) => p.placeholder));
  body = body
    .split("\n")
    .filter((line) => {
      const hit = line.match(/__INLINE_\d+__/);
      return !hit || keep.has(hit[0]);
    })
    .join("\n");

  for (const item of prompts) {
    if (!body.includes(item.placeholder)) {
      body = `${body.trim()}\n\n![${item.alt}](${item.placeholder})\n`;
    }
  }

  return { ...draft, body, inlineImagePrompts: prompts };
}

export async function generateInlineImages(
  draft: BlogDraft,
  plan?: VarietyPlan
): Promise<InlineImageResult> {
  const target = plan ? plan.images.inlineCount : 2;
  const plannedKinds = plan
    ? plan.images.kinds.map((k) => k.prompt)
    : INLINE_KINDS.slice();
  const prepared = ensureInlinePlaceholders(draft, target, plannedKinds);

  let body = prepared.body;
  let generated = 0;
  let failed = 0;
  const urls: string[] = [];
  const styleIds: string[] = [];
  const errors: string[] = [];
  const prompts = prepared.inlineImagePrompts;
  const usedStyles: string[] = [];

  for (let i = 0; i < prompts.length; i++) {
    const item = prompts[i];
    const style = plan?.images.inlinePalettes[i] ?? nextStyle(usedStyles);
    const modifier =
      plan?.images.inlineModifiers[i] ??
      RENDER_MODIFIERS[randomInt(RENDER_MODIFIERS.length)];
    const size = plan?.images.aspects[i]?.size ?? "1280x720";
    usedStyles.push(style.id);
    styleIds.push(style.id);
    try {
      const url = await generateImage(item.prompt, {
        size,
        filename: seoImageFilename(draft.slug, "inline", i + 1),
        style,
        modifier,
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

function shortLinkedInTitle(title: string, maxWords = 7): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

export type LinkedInImageInput = {
  title: string;
  topic: string;
  category?: string;
  /** Drawn palette, so the social card matches the run's visual plan. */
  style?: BrandStyle;
};

export async function linkedinImage(
  input: LinkedInImageInput | string
): Promise<{
  url: string;
  styleId: string;
}> {
  const title =
    typeof input === "string" ? input : input.title || input.topic;
  const topic = typeof input === "string" ? input : input.topic || input.title;
  const category =
    typeof input === "string" ? undefined : input.category || undefined;
  const headline = shortLinkedInTitle(title, 8);
  const style =
    typeof input === "string" ? pickBrandStyle() : input.style ?? pickBrandStyle();
  const slug = seoImageFilename(
    headline
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "post",
    "linkedin"
  );

  // 1. Generate a TEXT-FREE, brand-colored metaphor background. The model paints
  //    no words at all, so there is nothing for it to misspell or cut off.
  const bgPrompt = [
    "Create a premium square (1080x1080) abstract background illustration for a LinkedIn brand card.",
    `One single clear visual metaphor for this topic: ${topic}.`,
    "Composition: one bold focal metaphor, generous negative space, soft atmospheric depth, instantly readable at phone size.",
    "Keep the top third and the bottom strip visually calm and low-detail (darker or flatter) so a headline and footer can be overlaid on top afterwards.",
    "ABSOLUTELY NO TEXT of any kind: no words, letters, numbers, captions, titles, labels, code, UI chrome, buttons, watermarks, logos, or signatures. If tempted to write text, draw a shape instead.",
    "No people, no faces, no hands, no third-party brand logos, no fake app screenshots.",
    "Modern technical-agency aesthetic. Clean and editorial, never busy or cluttered.",
  ].join("\n");

  const bg = await renderImageBytes(bgPrompt, { size: "1080x1080", style });

  // 2. Composite a crisp headline + domain over it with Satori (next/og), so the
  //    text is always perfectly legible and correctly spelled.
  try {
    const bgDataUri = `data:${bg.mimeType};base64,${bg.bytes.toString("base64")}`;
    const card = await renderLinkedInCard({
      backgroundDataUri: bgDataUri,
      title: headline,
      category,
      styleId: style.id,
      slug,
    });
    return { url: card.url, styleId: style.id };
  } catch (error) {
    // Overlay failed: still ship the clean, tag-free, text-free background so a
    // run never loses its image over a rendering hiccup.
    console.warn(
      "LinkedIn text overlay failed, uploading plain background:",
      error instanceof Error ? error.message : String(error)
    );
    const ext = bg.mimeType.includes("jpeg") ? "jpg" : "png";
    const file = new File([new Uint8Array(bg.bytes)], `${slug}.${ext}`, {
      type: bg.mimeType,
    });
    const uploaded = await uploadToCloudinary(file);
    return { url: uploaded.url, styleId: style.id };
  }
}

export async function aiCoverImage(
  draft: BlogDraft,
  plan?: VarietyPlan
): Promise<{
  url: string;
  styleId: string;
}> {
  const style = plan?.images.coverPalette ?? pickBrandStyle();
  const modifier = plan?.images.coverModifier;
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
    filename: seoImageFilename(draft.slug || "post", "cover"),
    style,
    modifier,
  });
  return { url, styleId: style.id };
}
