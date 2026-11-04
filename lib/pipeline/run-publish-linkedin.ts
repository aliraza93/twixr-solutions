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

    // LinkedIn has the post. If recording that fails, say so loudly: the
    // row stays "publishing" (never retried) and the stuck-claim sweep moves
    // it to review for Ali to check the profile.
    try {
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
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";
      console.error("LinkedIn post published but not recorded:", post.id, reason);
      await logStage({
        runId,
        stage: "publish",
        status: "fail",
        refType: "SocialPost",
        refId: post.id,
        message: `Posted to LinkedIn but the status write failed: ${reason}`,
        meta: { externalId: result.externalId ?? null },
      });
      await notifyRunSummary(runId);
      return {
        runId,
        status: "fail",
        message: "Posted to LinkedIn but not recorded",
        socialPostId: post.id,
        externalId: result.externalId,
      };
    }

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

export const STUCK_CLAIM_MINUTES = 15;
export const STUCK_CLAIM_REASON =
  "LinkedIn publish not confirmed, check the profile before retrying";

/**
 * A row left in "publishing" means a run claimed it and never recorded the
 * outcome (killed mid-post, or the final write failed). The post may already
 * be on LinkedIn, so it never goes back to "scheduled": it moves to review
 * for Ali to check the profile. Called from the 10-minute tick.
 */
export async function recoverStuckPublishing(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - STUCK_CLAIM_MINUTES * 60_000);
  const stuck = await withDb(async () => {
    const db = requireDb();
    return db.socialPost.findMany({
      where: { status: "publishing", scheduledFor: { lt: cutoff } },
      select: { id: true },
      take: 20,
    });
  }, [] as Array<{ id: string }>);
  if (stuck.length === 0) return 0;

  const runId = createRunId();
  let moved = 0;
  for (const row of stuck) {
    const count = await withDb(async () => {
      const db = requireDb();
      const result = await db.socialPost.updateMany({
        where: { id: row.id, status: "publishing", scheduledFor: { lt: cutoff } },
        data: {
          status: "needs_review",
          reviewReasons: [STUCK_CLAIM_REASON],
          failReason: STUCK_CLAIM_REASON,
        },
      });
      return result.count;
    }, 0);
    if (count === 1) {
      moved++;
      await logStage({
        runId,
        stage: "publish",
        status: "warn",
        refType: "SocialPost",
        refId: row.id,
        message: STUCK_CLAIM_REASON,
      });
    }
  }
  return moved;
}
