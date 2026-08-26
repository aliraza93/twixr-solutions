import { GoogleGenAI } from "@google/genai";
import { pipeline } from "@/lib/pipeline/config";
import type { BlogDraft } from "@/lib/pipeline/generate-blog";
import { parseJsonFromModel } from "@/lib/pipeline/json";

export type CriticResult = {
  score: number;
  verdict: "pass" | "revise";
  issues: string[];
};

const RUBRIC = [
  "You are an independent editor grading content for Twixr Solutions.",
  "Return ONE JSON object: { \"score\": 0-100, \"verdict\": \"pass\"|\"revise\", \"issues\": string[] }.",
  "",
  "Rubric:",
  "- Factual grounding: no claim, number, client name, date, version, or price beyond the brief/sources.",
  "  Unverifiable specifics score low.",
  "- Voice fit: senior engineer, problem-first hook, outcome over stack, near-zero emojis,",
  "  no thought-leader tone, none of the banned marketing phrases.",
  "- Structure: correct shape; clean markdown for blogs; LinkedIn has hook/body/personal/CTA/hashtags.",
  "- SEO sanity: title and excerpt use the target keyword naturally; no stuffing.",
  "- Safety: no invented testimonial or metric; sources must support claims.",
  "",
  "Hard fail (verdict revise, score under 60) if: invented stats, em/en dashes, or thought-leader tone.",
  "Pass only when quality is genuinely publishable.",
].join("\n");

function client(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
}

async function grade(payload: string): Promise<CriticResult> {
  const ai = client();
  const response = await ai.models.generateContent({
    model: pipeline.models.critic,
    contents: payload,
    config: {
      systemInstruction: RUBRIC,
      temperature: 0.2,
    },
  });

  const text = response.text ?? "";
  const parsed = parseJsonFromModel<{
    score?: number;
    verdict?: string;
    issues?: string[];
  }>(text);

  const score = Math.max(0, Math.min(100, Number(parsed.score ?? 0)));
  const verdict: "pass" | "revise" =
    parsed.verdict === "pass" ? "pass" : "revise";

  return {
    score,
    verdict,
    issues: Array.isArray(parsed.issues)
      ? parsed.issues.map((i) => String(i))
      : [],
  };
}

export async function criticBlog(draft: BlogDraft): Promise<CriticResult> {
  const payload = [
    "Grade this blog draft.",
    "",
    JSON.stringify(
      {
        slug: draft.slug,
        title: draft.title,
        excerpt: draft.excerpt,
        category: draft.category,
        tags: draft.tags,
        body: draft.body,
        faqs: draft.faqs,
        sources: draft.sources,
      },
      null,
      2
    ),
  ].join("\n");
  return grade(payload);
}

export async function criticLinkedIn(text: string): Promise<CriticResult> {
  const payload = ["Grade this LinkedIn post.", "", text].join("\n");
  return grade(payload);
}
