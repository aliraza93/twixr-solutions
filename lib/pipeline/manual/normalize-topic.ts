import type { BlogFormat } from "@/lib/pipeline/seo/formats";
import { BLOG_FORMATS } from "@/lib/pipeline/seo/formats";

export const MANUAL_PILLAR_OPTIONS = [
  { value: "", label: "Auto" },
  { value: "Build/Laravel", label: "Laravel" },
  { value: "Build/NestJS", label: "NestJS / Node" },
  { value: "Build/AWS", label: "AWS / DevOps" },
  { value: "Build/API", label: "API Design" },
  { value: "Build/Frontend", label: "Frontend" },
  { value: "Build/AI", label: "AI / LLM" },
  { value: "Build/SEO", label: "Technical SEO" },
  { value: "Build/Security", label: "Security" },
  { value: "Build/Testing", label: "Testing / Code Quality" },
  { value: "Business/Upwork", label: "Upwork / Fiverr" },
  { value: "Business/Positioning", label: "Positioning" },
  { value: "Business/Agency", label: "Agency" },
  { value: "Business/Career", label: "Career" },
  { value: "Business/Freelancing", label: "Freelancing" },
  { value: "Timely", label: "Timely" },
  { value: "Code card", label: "Code card" },
  { value: "Build", label: "Other (Build)" },
] as const;

const NEWS_RE =
  /\b(released?|announces?|announced|launches?|launched|just (shipped|dropped)|new (model|version|feature|product)|changelog|GA\b|generally available)\b/i;

export type NormalizedManualTopic = {
  topic: string;
  targetKeyword: string;
  angle: string;
  pillar: string;
  formatHint: string;
  requiresLiveSource: boolean;
  newsLike: boolean;
  extraInstructions: string;
  sourceUrl: string;
};

function cleanLine(text: string): string {
  return text
    .replace(/[\u2014\u2013\u2212]/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferPillar(topic: string, angle: string): string {
  const hay = `${topic} ${angle}`.toLowerCase();
  if (NEWS_RE.test(hay)) return "Timely";
  if (/\b(upwork|fiverr|freelance|proposal)\b/.test(hay)) return "Business/Upwork";
  if (/\b(positioning|agency|pricing|client)\b/.test(hay)) return "Business/Positioning";
  if (/\b(career|interview|salary)\b/.test(hay)) return "Business/Career";
  if (/\b(laravel|eloquent|horizon|octane)\b/.test(hay)) return "Build/Laravel";
  if (/\b(nest|nodejs|node\.js|express)\b/.test(hay)) return "Build/NestJS";
  if (/\b(aws|ecs|rds|devops|ci\/cd|cloudfront)\b/.test(hay)) return "Build/AWS";
  if (/\b(seo|core web vitals|sitemap)\b/.test(hay)) return "Build/SEO";
  if (/\b(mcp|llm|claude|openai|gemini|rag|ai agent)\b/.test(hay)) return "Build/AI";
  if (/\b(security|auth|oauth|csrf)\b/.test(hay)) return "Build/Security";
  if (/\b(react|vue|next\.js|frontend|tailwind)\b/.test(hay)) return "Build/Frontend";
  return "Build";
}

function normalizeFormat(raw: string): string {
  const t = raw.trim();
  if (!t || /^auto$/i.test(t)) return "";
  const hit = BLOG_FORMATS.find(
    (f) => f.toLowerCase() === t.toLowerCase()
  );
  return hit || "";
}

/**
 * Normalize admin free-text into a Brief-shaped topic signal.
 */
export function normalizeManualTopic(input: {
  topic: string;
  angle?: string;
  pillar?: string;
  format?: string;
  sourceUrl?: string;
  additionalInstructions?: string;
  /** Admin chose Proceed as evergreen after verification failed. */
  forceEvergreen?: boolean;
}): NormalizedManualTopic {
  const topic = cleanLine(input.topic);
  if (!topic) {
    throw new Error("Topic is required");
  }

  const angle = cleanLine(input.angle || "");
  const pillarRaw = cleanLine(input.pillar || "");
  const pillar =
    pillarRaw && pillarRaw.toLowerCase() !== "auto"
      ? pillarRaw
      : inferPillar(topic, angle);

  const newsLike = NEWS_RE.test(`${topic} ${angle}`) || /^Timely/i.test(pillar);
  const sourceUrl = cleanLine(input.sourceUrl || "");
  const requiresLiveSource =
    Boolean(input.forceEvergreen) ? false : newsLike;

  const formatHint = normalizeFormat(input.format || "") as BlogFormat | "";

  return {
    topic: topic.slice(0, 200),
    targetKeyword: topic.slice(0, 80),
    angle: angle.slice(0, 400),
    pillar,
    formatHint,
    requiresLiveSource,
    newsLike,
    extraInstructions: cleanLine(input.additionalInstructions || "").slice(
      0,
      2000
    ),
    sourceUrl,
  };
}
