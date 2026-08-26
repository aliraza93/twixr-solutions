import { requireDb, withDb } from "@/lib/cms/db";
import { postToLinkedIn } from "@/lib/linkedin/client";
import { pipeline } from "@/lib/pipeline/config";
import { createRunId, logStage } from "@/lib/pipeline/log";
import { notifyRunSummary } from "@/lib/pipeline/notify";
import { validateLinkedIn } from "@/lib/pipeline/validators";

export type RunPublishOptions = {
  dryRun?: boolean;
};

export type RunPublishResult = {
  runId: string;
  status: "ok" | "skip" | "fail";
  message: string;
  socialPostId?: string;
  externalId?: string;
};

export async function runPublishLinkedin(
  options: RunPublishOptions = {}
): Promise<RunPublishResult> {
  const runId = createRunId();
  const dryRun = Boolean(options.dryRun);

  try {
    if (!pipeline.enabled) {
      await logStage({
        runId,
        stage: "publish",
        status: "skip",
        message: "PIPELINE_ENABLED is false",
      });
      return { runId, status: "skip", message: "Pipeline disabled" };
    }

    const post = await withDb(async () => {
      const db = requireDb();
      const now = new Date();
      return db.socialPost.findFirst({
        where: {
          status: "scheduled",
          channel: "linkedin",
          scheduledFor: { lte: now },
        },
        orderBy: { scheduledFor: "asc" },
      });
    }, null);

    if (!post) {
      await logStage({
        runId,
        stage: "publish",
        status: "skip",
        message: "No due LinkedIn posts",
      });
      return { runId, status: "skip", message: "Nothing due" };
    }

    const validation = await validateLinkedIn(post.body);
    if (!validation.ok) {
      if (!pipeline.autoPublish) {
        await withDb(async () => {
          const db = requireDb();
          await db.socialPost.update({
            where: { id: post.id },
            data: {
              status: "needs_review",
              reviewReasons: validation.reasons,
              failReason: validation.reasons.join("; "),
            },
          });
        }, undefined);

        await logStage({
          runId,
          stage: "publish",
          status: "warn",
          refType: "SocialPost",
          refId: post.id,
          message: "Re-validation failed; parked needs_review",
          meta: { reasons: validation.reasons },
        });
        await notifyRunSummary(runId);
        return {
          runId,
          status: "fail",
          message: "Validation failed",
          socialPostId: post.id,
        };
      }

      await logStage({
        runId,
        stage: "publish",
        status: "warn",
        refType: "SocialPost",
        refId: post.id,
        message: "Validation warnings ignored (PIPELINE_AUTO_PUBLISH)",
        meta: { reasons: validation.reasons },
      });
    }

    if (dryRun) {
      await logStage({
        runId,
        stage: "publish",
        status: "ok",
        refType: "SocialPost",
        refId: post.id,
        message: "Dry run - skipped LinkedIn API",
      });
      return {
        runId,
        status: "ok",
        message: "Dry run skipped post",
        socialPostId: post.id,
      };
    }

    const result = await postToLinkedIn({
      text: post.body,
      imageUrl: post.imageUrl || undefined,
      visibility: (post.visibility as "PUBLIC" | "CONNECTIONS") || "PUBLIC",
    });

    if (!result.ok) {
      await withDb(async () => {
        const db = requireDb();
        await db.socialPost.update({
          where: { id: post.id },
          data: {
            status: "failed",
            failReason: result.error ?? "LinkedIn post failed",
          },
        });
      }, undefined);

      await logStage({
        runId,
        stage: "publish",
        status: "fail",
        refType: "SocialPost",
        refId: post.id,
        message: result.error ?? "LinkedIn post failed",
      });
      await notifyRunSummary(runId);
      return {
        runId,
        status: "fail",
        message: result.error ?? "LinkedIn post failed",
        socialPostId: post.id,
      };
    }

    await withDb(async () => {
      const db = requireDb();
      await db.socialPost.update({
        where: { id: post.id },
        data: {
          status: "published",
          publishedAt: new Date(),
          externalId: result.externalId ?? null,
          failReason: "",
        },
      });
    }, undefined);

    await logStage({
      runId,
      stage: "publish",
      status: "ok",
      refType: "SocialPost",
      refId: post.id,
      message: "Published to LinkedIn",
      meta: { externalId: result.externalId },
    });

    return {
      runId,
      status: "ok",
      message: "Published",
      socialPostId: post.id,
      externalId: result.externalId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown publish failure";
    console.error("runPublishLinkedin failed:", error);
    try {
      await logStage({
        runId,
        stage: "publish",
        status: "fail",
        message,
      });
    } catch {
      // ignore
    }
    return { runId, status: "fail", message };
  }
}
