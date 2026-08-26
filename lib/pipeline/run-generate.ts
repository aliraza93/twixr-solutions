import type { Prisma } from "@prisma/client";
import { upsertBlogPost } from "@/lib/cms/blog";
import { requireDb, withDb } from "@/lib/cms/db";
import { stripEmDashes } from "@/lib/content/strip-em-dashes";
import {
  markBriefUsed,
  remainingBriefCount,
  takeNextBrief,
} from "@/lib/pipeline/briefs";
import { pipeline } from "@/lib/pipeline/config";
import { criticBlog, criticLinkedIn, type CriticResult } from "@/lib/pipeline/critic";
import { generateBlog } from "@/lib/pipeline/generate-blog";
import { generateLinkedIn } from "@/lib/pipeline/generate-linkedin";
import {
  aiCoverImage,
  generateInlineImages,
  linkedinImage,
} from "@/lib/pipeline/images";
import { createRunId, logStage } from "@/lib/pipeline/log";
import { notifyRunSummary } from "@/lib/pipeline/notify";
import { renderOgCover } from "@/lib/pipeline/og-cover";
import { validateBlog, validateLinkedIn } from "@/lib/pipeline/validators";

export type RunGenerateOptions = {
  dryRun?: boolean;
};

export type RunGenerateResult = {
  runId: string;
  status: "ok" | "skip" | "fail";
  message: string;
  blogPostId?: string;
  socialPostId?: string;
};

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function pipelineBlogExistsForToday(): Promise<boolean> {
  return withDb(async () => {
    const db = requireDb();
    const existing = await db.blogPost.findFirst({
      where: { origin: "pipeline", date: todayDate() },
      select: { id: true },
    });
    return Boolean(existing);
  }, false);
}

async function nextSortOrder(): Promise<number> {
  return withDb(async () => {
    const db = requireDb();
    const agg = await db.blogPost.aggregate({ _max: { sortOrder: true } });
    return (agg._max.sortOrder ?? 0) + 1;
  }, 0);
}

export async function runGenerate(
  options: RunGenerateOptions = {}
): Promise<RunGenerateResult> {
  const runId = createRunId();
  const dryRun = Boolean(options.dryRun);

  try {
    if (!pipeline.enabled) {
      await logStage({
        runId,
        stage: "brief",
        status: "skip",
        message: "PIPELINE_ENABLED is false",
      });
      await notifyRunSummary(runId);
      return { runId, status: "skip", message: "Pipeline disabled" };
    }

    if (await pipelineBlogExistsForToday()) {
      await logStage({
        runId,
        stage: "brief",
        status: "skip",
        message: `Pipeline blog already exists for ${todayDate()}`,
      });
      await notifyRunSummary(runId);
      return {
        runId,
        status: "skip",
        message: "Already generated for today",
      };
    }

    const brief = await takeNextBrief();
    if (!brief) {
      await logStage({
        runId,
        stage: "brief",
        status: "skip",
        message: "No queued briefs available",
      });
      await notifyRunSummary(runId);
      return { runId, status: "skip", message: "No briefs queued" };
    }

    await logStage({
      runId,
      stage: "brief",
      status: "ok",
      refType: "Brief",
      refId: brief.id,
      message: `${brief.pillar}: ${brief.topic}`,
      meta: { remaining: await remainingBriefCount() },
    });

    const draft = await generateBlog(brief);
    await logStage({
      runId,
      stage: "blog",
      status: "ok",
      message: draft.title,
      meta: { slug: draft.slug, model: pipeline.models.blog },
    });

    let coverUrl = "";
    let coverStyleId = "";
    try {
      if (pipeline.coverMode === "ai") {
        const cover = await aiCoverImage(draft);
        coverUrl = cover.url;
        coverStyleId = cover.styleId;
      } else {
        const cover = await renderOgCover({
          title: draft.title,
          category: draft.category,
          slug: draft.slug,
        });
        coverUrl = cover.url;
        coverStyleId = cover.styleId;
      }
      await logStage({
        runId,
        stage: "images",
        status: "ok",
        message: `Cover via ${pipeline.coverMode} (${coverStyleId})`,
        meta: { coverUrl, coverStyleId },
      });
    } catch (error) {
      await logStage({
        runId,
        stage: "images",
        status: "warn",
        message:
          error instanceof Error ? error.message : "Cover image failed",
      });
    }

    const inline = await generateInlineImages(draft);
    await logStage({
      runId,
      stage: "images",
      status: inline.generated >= 2 && !inline.failed ? "ok" : "warn",
      message: `Inline images generated=${inline.generated} failed=${inline.failed}`,
      meta: {
        urls: inline.urls,
        styleIds: inline.styleIds,
        errors: inline.errors,
        model: pipeline.models.image,
      },
    });

    const imageReasons: string[] = [];
    if (!coverUrl) imageReasons.push("Cover image missing");
    if (inline.generated < 2) {
      imageReasons.push(
        `Need at least 2 inline images, got ${inline.generated}`
      );
    }

    const order = await nextSortOrder();
    const blogPostId = await upsertBlogPost({
      slug: draft.slug,
      title: draft.title,
      excerpt: draft.excerpt,
      date: todayDate(),
      image: coverUrl,
      category: draft.category,
      tags: draft.tags,
      readingTime: draft.readingTime,
      author: pipeline.defaults.author,
      authorRole: pipeline.defaults.authorRole,
      authorImage: pipeline.defaults.authorImage,
      body: inline.body,
      faqs: draft.faqs,
      published: false,
      order,
      origin: "pipeline",
      reviewState: "needs_review",
      reviewReasons: [],
      briefId: brief.id,
    });

    const draftForValidation = { ...draft, body: inline.body };
    const vBlog = await validateBlog(draftForValidation, brief);
    await logStage({
      runId,
      stage: "validate",
      status: vBlog.ok ? "ok" : "warn",
      refType: "BlogPost",
      refId: blogPostId,
      message: vBlog.ok ? "Blog validators passed" : "Blog validators failed",
      meta: { reasons: vBlog.reasons },
    });

    let cBlog: CriticResult = {
      score: 0,
      verdict: "revise",
      issues: ["critic skipped"],
    };
    try {
      cBlog = await criticBlog(draftForValidation);
      await logStage({
        runId,
        stage: "critic",
        status:
          cBlog.verdict === "pass" && cBlog.score >= pipeline.criticMinScore
            ? "ok"
            : "warn",
        refType: "BlogPost",
        refId: blogPostId,
        message: `score=${cBlog.score} verdict=${cBlog.verdict}`,
        meta: { issues: cBlog.issues },
      });
    } catch (error) {
      await logStage({
        runId,
        stage: "critic",
        status: "fail",
        refType: "BlogPost",
        refId: blogPostId,
        message: error instanceof Error ? error.message : "Critic failed",
      });
    }

    const blogOk =
      vBlog.ok &&
      cBlog.verdict === "pass" &&
      cBlog.score >= pipeline.criticMinScore &&
      imageReasons.length === 0;

    // Auto-publish by default: validators/critic still run and log, but do not block.
    const shouldPublish = !dryRun && (pipeline.autoPublish || blogOk);

    const reviewReasons = [
      ...imageReasons,
      ...vBlog.reasons,
      ...cBlog.issues.map((i) => `critic: ${i}`),
    ];

    await upsertBlogPost({
      id: blogPostId,
      slug: draft.slug,
      title: draft.title,
      excerpt: draft.excerpt,
      date: todayDate(),
      image: coverUrl,
      category: draft.category,
      tags: draft.tags,
      readingTime: draft.readingTime,
      author: pipeline.defaults.author,
      authorRole: pipeline.defaults.authorRole,
      authorImage: pipeline.defaults.authorImage,
      body: inline.body,
      faqs: draft.faqs,
      published: shouldPublish,
      order,
      origin: "pipeline",
      reviewState: shouldPublish ? "approved" : "needs_review",
      reviewReasons: shouldPublish && pipeline.autoPublish ? [] : reviewReasons,
      criticScore: cBlog.score,
      briefId: brief.id,
    });

    let socialPostId: string | undefined;

    if (shouldPublish) {
      try {
        const li = await generateLinkedIn({
          title: draft.title,
          excerpt: draft.excerpt,
          body: inline.body,
          category: draft.category,
          topic: brief.topic,
          realExample: brief.realExample,
        });

        await logStage({
          runId,
          stage: "linkedin",
          status: "ok",
          message: "LinkedIn draft generated",
          meta: { altHooks: li.altHooks, hashtags: li.hashtags },
        });

        let liImageUrl = "";
        try {
          const liImg = await linkedinImage(brief.topic);
          liImageUrl = liImg.url;
        } catch (error) {
          await logStage({
            runId,
            stage: "images",
            status: "warn",
            message:
              error instanceof Error
                ? error.message
                : "LinkedIn image failed",
          });
        }

        const vLi = await validateLinkedIn(li.text);
        let cLi: CriticResult = {
          score: 0,
          verdict: "revise",
          issues: ["critic skipped"],
        };
        try {
          cLi = await criticLinkedIn(li.text);
        } catch (error) {
          await logStage({
            runId,
            stage: "critic",
            status: "warn",
            message:
              error instanceof Error
                ? error.message
                : "LinkedIn critic failed",
          });
        }

        const liOk =
          vLi.ok &&
          cLi.verdict === "pass" &&
          cLi.score >= pipeline.criticMinScore;

        const liReasons = [
          ...vLi.reasons,
          ...cLi.issues.map((i) => `critic: ${i}`),
        ];

        // Always schedule when auto-publishing; publish cron posts when due.
        const scheduleLinkedIn = pipeline.autoPublish || liOk;

        const scheduledFor = new Date(Date.now() + 12 * 60 * 60 * 1000);
        socialPostId = await withDb(async () => {
          const db = requireDb();
          const row = await db.socialPost.create({
            data: {
              channel: "linkedin",
              blogPostId,
              body: stripEmDashes(li.text),
              imageUrl: liImageUrl,
              visibility: "PUBLIC",
              status: scheduleLinkedIn ? "scheduled" : "needs_review",
              reviewReasons: (scheduleLinkedIn && pipeline.autoPublish
                ? []
                : liReasons) as Prisma.InputJsonValue,
              criticScore: cLi.score,
              scheduledFor,
            },
          });
          return row.id;
        }, undefined);

        await logStage({
          runId,
          stage: "linkedin",
          status: scheduleLinkedIn ? "ok" : "warn",
          refType: "SocialPost",
          refId: socialPostId,
          message: scheduleLinkedIn
            ? `Scheduled for ${scheduledFor.toISOString()}`
            : "Parked needs_review",
          meta: { reasons: liReasons, score: cLi.score, liOk },
        });
      } catch (error) {
        await logStage({
          runId,
          stage: "linkedin",
          status: "fail",
          message:
            error instanceof Error
              ? error.message
              : "LinkedIn generation failed",
        });
      }
    } else {
      await logStage({
        runId,
        stage: "linkedin",
        status: "skip",
        message: "Skipped because blog did not pass gate",
        meta: { reasons: reviewReasons, autoPublish: pipeline.autoPublish },
      });
    }

    await markBriefUsed(brief.id);
    await logStage({
      runId,
      stage: "brief",
      status: "ok",
      refType: "Brief",
      refId: brief.id,
      message: "Brief marked used",
    });

    await notifyRunSummary(runId);
    await logStage({
      runId,
      stage: "notify",
      status: "ok",
      message: "Summary email attempted",
    });

    return {
      runId,
      status: "ok",
      message: shouldPublish
        ? dryRun
          ? "Generated (dry run, unpublished)"
          : pipeline.autoPublish
            ? "Generated and auto-published"
            : "Generated and approved"
        : "Generated, needs review",
      blogPostId,
      socialPostId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown generate failure";
    console.error("runGenerate failed:", error);
    try {
      await logStage({
        runId,
        stage: "blog",
        status: "fail",
        message,
      });
      await notifyRunSummary(runId);
    } catch {
      // ignore secondary failures
    }
    return { runId, status: "fail", message };
  }
}
