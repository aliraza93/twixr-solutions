import { revalidatePath } from "next/cache";
import { requireDb, withDb } from "@/lib/cms/db";
import { pipeline } from "@/lib/pipeline/config";
import { createRunId, logStage } from "@/lib/pipeline/log";
import { notifyRunSummary } from "@/lib/pipeline/notify";
import { runPublishLinkedin } from "@/lib/pipeline/run-publish-linkedin";
import { notifySubscribersOfPost } from "@/lib/newsletter/notify";
import { runRefresh } from "@/lib/pipeline/refresh";
import { submitToIndexNow } from "@/lib/seo-indexnow";
import { absoluteUrl } from "@/lib/seo";
import { auditShape, auditVariety, formatAuditText } from "@/lib/pipeline/variety/audit";

export type RunPublishDueOptions = {
  dryRun?: boolean;
  /** Max LinkedIn posts to attempt in one run. */
  maxLinkedIn?: number;
  /** Set false on the high-frequency tick to skip the weekly refresh check. */
  withRefresh?: boolean;
  /** Set false to skip the variety audit. */
  withAudit?: boolean;
  /**
   * Suppress "nothing to do" logging. Set on the 10-minute tick: without it
   * the GenerationLog grows by ~288 empty rows a day.
   */
  quiet?: boolean;
};

export type RunPublishDueResult = {
  runId: string;
  status: "ok" | "skip" | "fail";
  message: string;
  blogsPublished: number;
  linkedIn: Array<{
    status: string;
    message: string;
    socialPostId?: string;
  }>;
};

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function revalidatePublic() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

/** Flip approved pipeline blogs whose publishAt is due. */
export async function publishDueBlogs(options: {
  dryRun?: boolean;
  runId: string;
  quiet?: boolean;
}): Promise<number> {
  const due = await withDb(async () => {
    const db = requireDb();
    const now = new Date();
    return db.blogPost.findMany({
      where: {
        origin: "pipeline",
        published: false,
        reviewState: "approved",
        publishAt: { lte: now },
      },
      orderBy: { publishAt: "asc" },
      take: 20,
      select: { id: true, slug: true, publishAt: true },
    });
  }, []);

  if (due.length === 0) {
    if (!options.quiet) {
      await logStage({
        runId: options.runId,
        stage: "publish",
        status: "skip",
        message: "No due blogs",
      });
    }
    return 0;
  }

  if (options.dryRun) {
    await logStage({
      runId: options.runId,
      stage: "publish",
      status: "ok",
      message: `Dry run: ${due.length} blog(s) would go live`,
      meta: { ids: due.map((b) => b.id) },
    });
    return due.length;
  }

  await withDb(async () => {
    const db = requireDb();
    const date = todayDate();
    for (const row of due) {
      await db.blogPost.update({
        where: { id: row.id },
        data: { published: true, date },
      });
    }
  }, undefined);

  revalidatePublic();

  // Push the new URLs to IndexNow so Bing (and the LLM search tools reading
  // its index) pick them up now instead of on the next crawl.
  const indexNow = await submitToIndexNow(
    due.map((row) => absoluteUrl(`/blog/${row.slug}`))
  );

  for (const row of due) {
    try {
      await notifySubscribersOfPost(row.id);
    } catch (error) {
      console.error("Newsletter notify failed:", row.id, error);
    }
  }

  await logStage({
    runId: options.runId,
    stage: "publish",
    status: "ok",
    message: `Published ${due.length} blog(s)`,
    meta: {
      ids: due.map((b) => b.id),
      slugs: due.map((b) => b.slug),
      indexNow,
    },
  });

  return due.length;
}

/**
 * Publish due blogs, then any due LinkedIn posts.
 * Safe to call from both generate and publish crons (Hobby: 2 windows/day).
 */
export async function runPublishDue(
  options: RunPublishDueOptions = {}
): Promise<RunPublishDueResult> {
  const runId = createRunId();
  const dryRun = Boolean(options.dryRun);
  const maxLinkedIn = options.maxLinkedIn ?? 3;
  const linkedIn: RunPublishDueResult["linkedIn"] = [];

  try {
    if (!pipeline.enabled) {
      return {
        runId,
        status: "skip",
        message: "Pipeline disabled",
        blogsPublished: 0,
        linkedIn,
      };
    }

    const quiet = Boolean(options.quiet);
    const blogsPublished = await publishDueBlogs({ dryRun, runId, quiet });

    for (let i = 0; i < maxLinkedIn; i++) {
      const result = await runPublishLinkedin({ dryRun, quiet });
      linkedIn.push({
        status: result.status,
        message: result.message,
        socialPostId: result.socialPostId,
      });
      if (result.status === "skip") break;
    }

    // The weekly refresh rides along here: it is cheap to check (one indexed
    // query) and it keeps the archive from aging silently.
    let refresh: Awaited<ReturnType<typeof runRefresh>> | null = null;
    if (!dryRun && options.withRefresh !== false) {
      refresh = await runRefresh({ dryRun });
      if (refresh.status !== "skip") {
        await logStage({
          runId,
          stage: "refresh",
          status: refresh.status === "ok" ? "ok" : "warn",
          message: refresh.message,
        });
      }
    }

    // Variety audit: randomization that is never measured is trusted on faith.
    if (options.withAudit !== false) {
      try {
        const [variety, shape] = await Promise.all([
          auditVariety(20),
          auditShape(20),
        ]);
        await logStage({
          runId,
          stage: "variety",
          status: variety.healthy ? "ok" : "warn",
          message: formatAuditText(variety, shape),
          meta: { variety, shape },
        });
      } catch (error) {
        console.error("Variety audit failed:", error);
      }
    }

    const liOk = linkedIn.filter((r) => r.status === "ok").length;
    const liFail = linkedIn.filter((r) => r.status === "fail").length;

    if (
      blogsPublished === 0 &&
      liOk === 0 &&
      liFail === 0 &&
      (!refresh || refresh.status === "skip")
    ) {
      return {
        runId,
        status: "skip",
        message: "Nothing due",
        blogsPublished: 0,
        linkedIn,
      };
    }

    const message = [
      blogsPublished ? `${blogsPublished} blog(s)` : null,
      liOk ? `${liOk} LinkedIn` : null,
      liFail ? `${liFail} LinkedIn failed` : null,
      refresh && refresh.status === "ok" ? `refreshed ${refresh.slug}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    await notifyRunSummary(runId);

    return {
      runId,
      status: liFail && !blogsPublished && !liOk ? "fail" : "ok",
      message: message || "Done",
      blogsPublished,
      linkedIn,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown publish-due failure";
    console.error("runPublishDue failed:", error);
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
    return {
      runId,
      status: "fail",
      message,
      blogsPublished: 0,
      linkedIn,
    };
  }
}
