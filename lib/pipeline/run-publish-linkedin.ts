import { requireDb, withDb } from "@/lib/cms/db";
import { postToLinkedIn } from "@/lib/linkedin/client";
import { pipeline } from "@/lib/pipeline/config";
import { isPipelinePaused } from "@/lib/jarvis/pause";
import { createRunId, logStage } from "@/lib/pipeline/log";
import { notifyRunSummary } from "@/lib/pipeline/notify";
import { validateLinkedIn } from "@/lib/pipeline/validators";

export type RunPublishOptions = {
  dryRun?: boolean;
  /**
   * Suppress "nothing to do" logging. The publish tick runs every 10 minutes,
   * so logging each no-op would write ~144 rows a day for no information.
   */
  quiet?: boolean;
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
  // Set once this run owns the row (status "publishing"), and once LinkedIn
  // has accepted the post. A claimed row that was never posted is handed
  // back on error; a posted one is never handed back, so it cannot go twice.
  let claimedId: string | null = null;
  let posted = false;

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

    // Quiet on purpose: the tick calls this every 10 minutes.
    if (await isPipelinePaused()) {
      return { runId, status: "skip", message: "Pipeline paused from Jarvis" };
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
      if (!options.quiet) {
        await logStage({
          runId,
          stage: "publish",
          status: "skip",
          message: "No due LinkedIn posts",
        });
      }
      return { runId, status: "skip", message: "Nothing due" };
    }

    // Claim before validating or posting. If Jarvis paused or moved the row,
    // or another run took it, the conditional update matches nothing.
    if (!dryRun) {
      const claimed = await withDb(async () => {
        const db = requireDb();
        const result = await db.socialPost.updateMany({
          where: { id: post.id, status: "scheduled", scheduledFor: { lte: new Date() } },
          data: { status: "publishing" },
        });
        return result.count;
      }, 0);
      if (claimed !== 1) {
        return {
          runId,
          status: "skip",
          message: "Post changed before claim",
          socialPostId: post.id,
        };
      }
      claimedId = post.id;
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
    posted = result.ok;

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
    if (claimedId && !posted) {
      await releaseClaim(claimedId);
    }
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

/** Hand a claimed, never-posted row back to the queue. */
async function releaseClaim(id: string): Promise<void> {
  await withDb(async () => {
    const db = requireDb();
    await db.socialPost.updateMany({
      where: { id, status: "publishing" },
      data: { status: "scheduled" },
    });
  }, undefined);
}
