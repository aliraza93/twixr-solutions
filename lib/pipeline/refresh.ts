import Anthropic from "@anthropic-ai/sdk";
import { requireDb, withDb } from "@/lib/cms/db";
import { stripEmDashes } from "@/lib/content/strip-em-dashes";
import { pipeline } from "@/lib/pipeline/config";
import { capsFor } from "@/lib/pipeline/model-capabilities";
import { logStage } from "@/lib/pipeline/log";
import { readKb } from "@/lib/pipeline/prompt";
import { startOfUtcWeek } from "@/lib/pipeline/schedule";
import { createRng } from "@/lib/pipeline/variety/rng";
import { submitToIndexNow } from "@/lib/seo-indexnow";
import { absoluteUrl } from "@/lib/seo";

/**
 * Content refresh loop.
 *
 * Nothing in the pipeline ever touched a published post again, so every
 * article's dateModified equalled its datePublished forever and the archive
 * aged silently. This picks an old post each week and genuinely revisits it:
 * stale versions corrected, a gap filled, anything that aged badly fixed.
 *
 * It also diversifies the publish stream, because a refresh is not a new post
 * and does not count against the weekly quota.
 */

const REFRESH_TOOL = {
  name: "submit_refreshed_post",
  description: "Submit the refreshed article body and a short changelog note.",
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    properties: {
      body: { type: "string" as const },
      changeNote: { type: "string" as const },
      changed: { type: "boolean" as const },
    },
    required: ["body", "changeNote", "changed"],
  },
};

export type RefreshResult = {
  status: "ok" | "skip" | "fail";
  message: string;
  slug?: string;
  changeNote?: string;
};

/** Posts old enough to be worth revisiting, least recently reviewed first. */
async function pickRefreshCandidate(): Promise<{
  id: string;
  slug: string;
  title: string;
  body: string;
  date: string;
  contentCluster: string;
} | null> {
  const minAge = new Date(
    Date.now() - pipeline.variety.refreshMinAgeDays * 86_400_000
  );

  return withDb(async () => {
    const db = requireDb();
    const rows = await db.blogPost.findMany({
      where: {
        origin: "pipeline",
        published: true,
        createdAt: { lt: minAge },
        OR: [{ lastReviewedAt: null }, { lastReviewedAt: { lt: minAge } }],
      },
      orderBy: [{ lastReviewedAt: "asc" }, { createdAt: "asc" }],
      take: 5,
      select: {
        id: true,
        slug: true,
        title: true,
        body: true,
        date: true,
        contentCluster: true,
      },
    });
    if (!rows.length) return null;
    // Pick among the oldest few so the order is not strictly predictable.
    const rng = createRng();
    return rng.pick(rows);
  }, null);
}

async function howManyRefreshesThisWeek(): Promise<number> {
  return withDb(async () => {
    const db = requireDb();
    const row = await db.pipelineWeek.findUnique({
      where: { weekStart: startOfUtcWeek() },
      select: { refreshesDone: true },
    });
    return row?.refreshesDone ?? 0;
  }, 0);
}

async function countRefresh(): Promise<void> {
  await withDb(async () => {
    const db = requireDb();
    await db.pipelineWeek.updateMany({
      where: { weekStart: startOfUtcWeek() },
      data: { refreshesDone: { increment: 1 } },
    });
  }, undefined);
}

export async function runRefresh(
  options: { dryRun?: boolean; force?: boolean } = {}
): Promise<RefreshResult> {
  const runId = `refresh-${Date.now()}`;

  if (!pipeline.enabled) {
    return { status: "skip", message: "Pipeline disabled" };
  }

  if (!options.force) {
    const done = await howManyRefreshesThisWeek();
    if (done >= pipeline.variety.refreshPerWeek) {
      return {
        status: "skip",
        message: `Weekly refresh quota met (${done}/${pipeline.variety.refreshPerWeek})`,
      };
    }
  }

  const post = await pickRefreshCandidate();
  if (!post) {
    return { status: "skip", message: "No posts old enough to refresh" };
  }

  if (options.dryRun) {
    return {
      status: "ok",
      message: `Dry run: would refresh ${post.slug}`,
      slug: post.slug,
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return { status: "fail", message: "ANTHROPIC_API_KEY is not set" };
  }

  const model = pipeline.models.blog;
  const caps = capsFor(model);
  const voice = readKb("voice-guide");

  const system = [
    "You are revisiting one of your own published articles months later.",
    "You MUST call the submit_refreshed_post tool. Do not reply with free-form prose.",
    "",
    "ABSOLUTE RULES (never violate):",
    "1. Never use em dashes (U+2014), en dashes (U+2013), or minus signs (U+2212). Use a spaced hyphen.",
    "2. Never invent metrics, client names, dates, versions, prices, or benchmarks.",
    "3. Keep every image placeholder, markdown image, and link exactly as it appears.",
    "",
    "VOICE GUIDE:",
    voice,
  ].join("\n");

  const user = [
    "Revisit this article. This is a real update, not a rewrite.",
    "",
    "DO THIS:",
    "- Correct anything that has aged badly: version numbers, deprecated advice, changed defaults.",
    "- Add one short section answering a question the article should have covered and did not.",
    "- Tighten any section that reads as padded.",
    "- Keep the structure, headings, images, links, and voice intact.",
    "",
    "DO NOT:",
    "- Do not add a claim, number, client, or benchmark you cannot support.",
    "- Do not remove existing images or links.",
    "- Do not change what the article is fundamentally about.",
    "- If nothing genuinely needs updating, set changed to false and return the body unchanged.",
    "",
    `Title: ${post.title}`,
    `Originally published: ${post.date}`,
    post.contentCluster ? `Cluster: ${post.contentCluster}` : "",
    "",
    "CURRENT BODY (markdown):",
    post.body,
    "",
    "Call submit_refreshed_post with the full updated body, a one-sentence changeNote describing what you changed, and changed set to true or false.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model,
      max_tokens: 16000,
      system,
      tools: [REFRESH_TOOL],
      tool_choice: caps.forcedToolChoice
        ? { type: "tool", name: "submit_refreshed_post" }
        : { type: "auto" },
      messages: [{ role: "user", content: user }],
    };
    const response = await client.messages.create(params);
    const block = response.content.find(
      (b) => b.type === "tool_use" && b.name === "submit_refreshed_post"
    );
    if (!block || block.type !== "tool_use") {
      return { status: "fail", message: "Refresh model returned no tool payload" };
    }

    const result = block.input as {
      body?: string;
      changeNote?: string;
      changed?: boolean;
    };
    const newBody = String(result.body ?? "").trim();
    const changeNote = String(result.changeNote ?? "").trim();

    // Guard against a pass that truncates the article. A refresh should be
    // roughly the same size or a little longer, never a stub.
    const before = post.body.trim().split(/\s+/).filter(Boolean).length;
    const after = newBody.split(/\s+/).filter(Boolean).length;
    if (!newBody || after < before * 0.7) {
      await logStage({
        runId,
        stage: "refresh",
        status: "warn",
        refType: "BlogPost",
        refId: post.id,
        message: `Refresh rejected for ${post.slug} (${before} -> ${after} words)`,
        meta: { before, after },
      });
      return {
        status: "skip",
        message: `Refresh returned a shorter body for ${post.slug}, kept the original`,
        slug: post.slug,
      };
    }

    if (result.changed === false) {
      // Still stamp the review so the same post is not re-picked immediately.
      await withDb(async () => {
        const db = requireDb();
        await db.blogPost.update({
          where: { id: post.id },
          data: { lastReviewedAt: new Date() },
        });
      }, undefined);
      await countRefresh();
      await logStage({
        runId,
        stage: "refresh",
        status: "ok",
        refType: "BlogPost",
        refId: post.id,
        message: `Reviewed ${post.slug}, nothing needed changing`,
      });
      return {
        status: "ok",
        message: `Reviewed ${post.slug}, no change needed`,
        slug: post.slug,
      };
    }

    await withDb(async () => {
      const db = requireDb();
      await db.blogPost.update({
        where: { id: post.id },
        data: {
          body: stripEmDashes(newBody),
          lastReviewedAt: new Date(),
        },
      });
    }, undefined);

    await countRefresh();

    const indexNow = await submitToIndexNow([absoluteUrl(`/blog/${post.slug}`)]);

    await logStage({
      runId,
      stage: "refresh",
      status: "ok",
      refType: "BlogPost",
      refId: post.id,
      message: `Refreshed ${post.slug}: ${changeNote}`,
      meta: { before, after, changeNote, indexNow },
    });

    return {
      status: "ok",
      message: `Refreshed ${post.slug}`,
      slug: post.slug,
      changeNote,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown refresh failure";
    await logStage({
      runId,
      stage: "refresh",
      status: "fail",
      refType: "BlogPost",
      refId: post.id,
      message,
    });
    return { status: "fail", message };
  }
}
