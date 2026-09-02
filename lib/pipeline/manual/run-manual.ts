import type { Brief } from "@prisma/client";
import { requireDb, withDb } from "@/lib/cms/db";
import { createRunId } from "@/lib/pipeline/log";
import { checkManualTopicDuplicate } from "@/lib/pipeline/manual/duplicate-check";
import {
  normalizeManualTopic,
  type NormalizedManualTopic,
} from "@/lib/pipeline/manual/normalize-topic";
import { fetchSourceExcerpt } from "@/lib/pipeline/manual/source-fetch";
import { appendManualTopicToBank } from "@/lib/pipeline/manual/topic-bank-append";
import {
  runGenerateFromBrief,
  type RunGenerateResult,
} from "@/lib/pipeline/run-generate";

export type ManualGenerateInput = {
  topic: string;
  angle?: string;
  pillar?: string;
  format?: string;
  sourceUrl?: string;
  additionalInstructions?: string;
  generateImages?: boolean;
  generateLinkedIn?: boolean;
  publishAutomatically?: boolean;
  /** After verification failed, continue as evergreen. */
  forceEvergreen?: boolean;
  /** Supporting-article path after duplicate warning. */
  allowCannibalOverride?: boolean;
  mode?: "analyze" | "generate";
};

export type ManualAnalyzeResult = {
  ok: boolean;
  normalized: NormalizedManualTopic;
  duplicate: Awaited<ReturnType<typeof checkManualTopicDuplicate>>;
  verificationFailed?: boolean;
  verificationError?: string;
  sourceExcerpt?: string;
  sourceTitle?: string;
};

export async function analyzeManualTopic(
  input: ManualGenerateInput
): Promise<ManualAnalyzeResult> {
  const normalized = normalizeManualTopic({
    topic: input.topic,
    angle: input.angle,
    pillar: input.pillar,
    format: input.format,
    sourceUrl: input.sourceUrl,
    additionalInstructions: input.additionalInstructions,
    forceEvergreen: input.forceEvergreen,
  });

  const duplicate = await checkManualTopicDuplicate({
    topic: normalized.topic,
    targetKeyword: normalized.targetKeyword,
    angle: normalized.angle,
    pillar: normalized.pillar,
  });

  let verificationFailed = false;
  let verificationError: string | undefined;
  let sourceExcerpt: string | undefined;
  let sourceTitle: string | undefined;

  if (normalized.sourceUrl) {
    const fetched = await fetchSourceExcerpt(normalized.sourceUrl);
    if (fetched.ok) {
      sourceExcerpt = fetched.excerpt;
      sourceTitle = fetched.title;
    } else {
      verificationFailed = true;
      verificationError = fetched.error;
    }
  } else if (normalized.requiresLiveSource && !input.forceEvergreen) {
    verificationFailed = true;
    verificationError =
      "News/release topics need a Source URL (or choose Proceed as evergreen).";
  }

  const ok =
    !duplicate.blocked &&
    !(verificationFailed && !input.forceEvergreen);

  return {
    ok,
    normalized: {
      ...normalized,
      // If evergreen forced after news detect, clear live-source flag
      requiresLiveSource: input.forceEvergreen
        ? false
        : normalized.requiresLiveSource,
    },
    duplicate,
    verificationFailed,
    verificationError,
    sourceExcerpt,
    sourceTitle,
  };
}

export async function createManualBrief(
  normalized: NormalizedManualTopic
): Promise<Brief> {
  const brief = await withDb(async () => {
    const db = requireDb();
    return db.brief.create({
      data: {
        pillar: normalized.pillar,
        topic: normalized.topic,
        targetKeyword: normalized.targetKeyword,
        angle: normalized.angle,
        realExample: "",
        requiresLiveSource: normalized.requiresLiveSource,
        status: "queued",
        origin: "manual",
        sourceUrl: normalized.sourceUrl,
        formatHint: normalized.formatHint,
        extraInstructions: normalized.extraInstructions,
      },
    });
  }, null);

  if (!brief) {
    throw new Error("Failed to create manual brief (database unavailable)");
  }

  try {
    appendManualTopicToBank({
      topic: normalized.topic,
      pillar: normalized.pillar,
    });
  } catch (error) {
    console.error("topic-bank append failed:", error);
  }

  return brief;
}

export async function runManualGenerate(
  input: ManualGenerateInput
): Promise<
  | { status: "analyze"; analyze: ManualAnalyzeResult }
  | {
      status: "blocked";
      analyze: ManualAnalyzeResult;
    }
  | {
      status: "ok" | "skip" | "fail";
      analyze: ManualAnalyzeResult;
      result: RunGenerateResult;
      briefId: string;
    }
> {
  const analyze = await analyzeManualTopic(input);
  if (input.mode === "analyze") {
    return { status: "analyze", analyze };
  }

  if (!analyze.ok && !input.allowCannibalOverride) {
    return { status: "blocked", analyze };
  }
  if (
    analyze.verificationFailed &&
    !input.forceEvergreen &&
    !analyze.sourceExcerpt
  ) {
    return { status: "blocked", analyze };
  }

  const brief = await createManualBrief(analyze.normalized);
  const runId = createRunId();
  const publishMode = input.publishAutomatically
    ? "publish_now"
    : "draft";

  const result = await runGenerateFromBrief(brief, {
    runId,
    skipCadence: true,
    skipTodayGuard: true,
    publishMode,
    generateImages: input.generateImages !== false,
    generateLinkedIn: input.generateLinkedIn !== false,
    sourceUrl: analyze.normalized.sourceUrl || undefined,
    sourceExcerpt: analyze.sourceExcerpt,
    additionalInstructions: analyze.normalized.extraInstructions || undefined,
    formatOverride: analyze.normalized.formatHint || undefined,
    allowCannibalOverride: Boolean(input.allowCannibalOverride),
    notify: true,
  });

  return {
    status: result.status,
    analyze,
    result,
    briefId: brief.id,
  };
}
