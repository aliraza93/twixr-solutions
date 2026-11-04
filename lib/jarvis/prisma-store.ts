import type { Prisma, PrismaClient } from "@prisma/client";
import { requireDb } from "@/lib/cms/db";
import { remainingBriefCount } from "@/lib/pipeline/briefs";
import { createRunId } from "@/lib/pipeline/log";
import { checkManualTopicDuplicate } from "@/lib/pipeline/manual/duplicate-check";
import { getSiteContentInventory, inventoryUrlAllowlist } from "@/lib/pipeline/seo/inventory";
import { JARVIS_SOURCE, JARVIS_STAGE, getPipelineControl } from "@/lib/jarvis/pause";
import { PAUSE_MARKER } from "@/lib/jarvis/states";
import type {
  BlogGuard,
  ControlLog,
  ControlStore,
  Move,
  Page,
  RunSummary,
  SocialGuard,
} from "@/lib/jarvis/store";

/** ControlStore over the pipeline's own Prisma tables. */

function logData(log: ControlLog): Prisma.GenerationLogCreateInput {
  return {
    runId: createRunId(),
    stage: JARVIS_STAGE,
    status: log.status,
    refType: log.refType,
    refId: log.refId,
    message: log.message.slice(0, 2000),
    meta: log.meta as Prisma.InputJsonValue,
  };
}

function paged<T extends { id: string }>(rows: T[], limit: number): Page<T> {
  const items = rows.slice(0, limit);
  return { items, nextCursor: rows.length > limit ? items[items.length - 1].id : null };
}

function cursorArgs(cursor?: string): { cursor?: { id: string }; skip?: number } {
  return cursor ? { cursor: { id: cursor }, skip: 1 } : {};
}

const newestFirst = [{ createdAt: "desc" as const }, { id: "desc" as const }];

const pausedFilter = { array_starts_with: PAUSE_MARKER };

function blogWhere(state?: string): Prisma.BlogPostWhereInput {
  const base: Prisma.BlogPostWhereInput = { origin: "pipeline" };
  switch (state) {
    case "published":
      return { ...base, published: true };
    case "scheduled":
      return { ...base, published: false, reviewState: "approved" };
    case "discarded":
      return { ...base, published: false, reviewState: "none" };
    case "paused":
      return { ...base, published: false, reviewState: "needs_review", reviewReasons: pausedFilter };
    case "needs_review":
      return {
        ...base,
        published: false,
        reviewState: "needs_review",
        NOT: { reviewReasons: pausedFilter },
      };
    default:
      return base;
  }
}

function socialWhere(state?: string): Prisma.SocialPostWhereInput {
  switch (state) {
    case "published":
    case "scheduled":
    case "manual":
    case "failed":
      return { status: state };
    case "paused":
      return { status: "needs_review", reviewReasons: pausedFilter };
    case "needs_review":
      return { status: "needs_review", NOT: { reviewReasons: pausedFilter } };
    default:
      return {};
  }
}

const blogSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  origin: true,
  published: true,
  reviewState: true,
  reviewReasons: true,
  criticScore: true,
  publishAt: true,
  briefId: true,
  createdAt: true,
  updatedAt: true,
  socialPosts: {
    select: {
      id: true,
      channel: true,
      status: true,
      reviewReasons: true,
      criticScore: true,
      scheduledFor: true,
      publishedAt: true,
    },
  },
} satisfies Prisma.BlogPostSelect;

const socialSelect = {
  id: true,
  channel: true,
  status: true,
  reviewReasons: true,
  criticScore: true,
  scheduledFor: true,
  publishedAt: true,
  body: true,
  blogPostId: true,
  failReason: true,
  createdAt: true,
} satisfies Prisma.SocialPostSelect;

const SEVERITY: Record<string, number> = { skip: 0, ok: 1, warn: 2, fail: 3 };

type CreateBriefResult = Awaited<ReturnType<ControlStore["createBrief"]>>;

const SERIALIZABLE = { isolationLevel: "Serializable" as const };

/** Postgres serialization failure or Prisma's write conflict code. */
export function isSerializationFailure(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "P2034" || code === "40001";
}

/** Guards for the cross-row LinkedIn link, evaluated inside the write. */
export function blogLinkWhere(guard: BlogGuard["social"]): Prisma.BlogPostWhereInput {
  return "noneScheduled" in guard
    ? { socialPosts: { none: { status: "scheduled" } } }
    : { socialPosts: { none: { status: "scheduled", scheduledFor: { lt: guard.noneScheduledBefore } } } };
}

export function socialLinkWhere(blogLiveBy: Date): Prisma.SocialPostWhereInput {
  return {
    OR: [
      { blogPostId: null },
      { blogPost: { published: true } },
      { blogPost: { reviewState: "approved", publishAt: { lte: blogLiveBy } } },
    ],
  };
}

/** Run a guarded write at Serializable; a serialization failure means "moved". */
async function serial<T>(db: PrismaClient, fn: (tx: Prisma.TransactionClient) => Promise<T>, onConflict: T): Promise<T> {
  try {
    return await db.$transaction(fn, SERIALIZABLE);
  } catch (error) {
    if (isSerializationFailure(error)) return onConflict;
    throw error;
  }
}

function moveLog(kind: "BlogPost" | "SocialPost", m: Move): ControlLog {
  return {
    refType: kind,
    refId: m.id,
    status: "ok",
    message: `Jarvis resume moved a past-due ${kind === "BlogPost" ? "blog" : "LinkedIn post"} to ${m.to.toISOString()}`,
    meta: { source: JARVIS_SOURCE, action: "reschedule", from: m.from.toISOString(), to: m.to.toISOString() },
  };
}

export function createPrismaControlStore(getDb: () => PrismaClient = requireDb): ControlStore {
  const db = getDb;

  return {
    pipelineControl: () => getPipelineControl(db()),

    async recentRuns(limit, since) {
      const groups = await db().generationLog.groupBy({
        by: ["runId"],
        where: { stage: { not: JARVIS_STAGE }, createdAt: { gte: since } },
        _max: { createdAt: true },
        orderBy: { _max: { createdAt: "desc" } },
        take: limit,
      });
      const ids = groups.map((g) => g.runId);
      if (!ids.length) return [];
      const rows = await db().generationLog.findMany({
        where: { runId: { in: ids } },
        orderBy: { createdAt: "asc" },
        select: { runId: true, stage: true, status: true, message: true, createdAt: true },
      });
      return ids.map((runId): RunSummary => {
        const own = rows.filter((r) => r.runId === runId);
        const worst = own.reduce<string>(
          (acc, r) => ((SEVERITY[r.status] ?? 0) > (SEVERITY[acc] ?? 0) ? r.status : acc),
          "skip"
        ) as RunSummary["status"];
        return {
          runId,
          startedAt: own[0].createdAt,
          endedAt: own[own.length - 1].createdAt,
          status: worst,
          stages: [...new Set(own.map((r) => r.stage))],
          lastMessage: own[own.length - 1].message,
        };
      });
    },

    async dayPlan(day) {
      const row = await db().pipelineDay.findUnique({ where: { day } });
      if (!row) return null;
      return {
        day: row.day,
        go: row.go,
        slots: row.slots,
        generatedCount: row.generatedCount,
        generateAt: row.generateAt,
        secondAt: row.secondAt,
        reason: row.reason,
      };
    },

    async nextBlogPublishAt() {
      const row = await db().blogPost.findFirst({
        where: { origin: "pipeline", published: false, reviewState: "approved", publishAt: { not: null } },
        orderBy: { publishAt: "asc" },
        select: { publishAt: true },
      });
      return row?.publishAt ?? null;
    },

    async nextLinkedInAt() {
      const row = await db().socialPost.findFirst({
        where: { status: "scheduled", channel: "linkedin" },
        orderBy: { scheduledFor: "asc" },
        select: { scheduledFor: true },
      });
      return row?.scheduledFor ?? null;
    },

    queuedBriefCount: () => remainingBriefCount(),

    async listBriefs({ cursor, limit, status, origin }) {
      const rows = await db().brief.findMany({
        where: { ...(status ? { status } : {}), ...(origin ? { origin } : {}) },
        orderBy: newestFirst,
        take: limit + 1,
        ...cursorArgs(cursor),
      });
      return paged(rows, limit);
    },

    async listBlogs({ cursor, limit, state }) {
      const rows = await db().blogPost.findMany({
        where: blogWhere(state),
        orderBy: newestFirst,
        take: limit + 1,
        select: blogSelect,
        ...cursorArgs(cursor),
      });
      return paged(
        rows.map(({ socialPosts, ...b }) => ({ ...b, social: socialPosts })),
        limit
      );
    },

    async listSocial({ cursor, limit, state }) {
      const rows = await db().socialPost.findMany({
        where: socialWhere(state),
        orderBy: newestFirst,
        take: limit + 1,
        select: socialSelect,
        ...cursorArgs(cursor),
      });
      return paged(rows, limit);
    },

    async listLogs({ cursor, limit, runId, refId, stage, status }) {
      const rows = await db().generationLog.findMany({
        where: {
          ...(runId ? { runId } : {}),
          ...(refId ? { refId } : {}),
          ...(stage ? { stage } : {}),
          ...(status ? { status } : {}),
        },
        orderBy: newestFirst,
        take: limit + 1,
        ...cursorArgs(cursor),
      });
      return paged(rows, limit);
    },

    async getBlog(id) {
      const row = await db().blogPost.findUnique({
        where: { id },
        select: {
          ...blogSelect,
          body: true,
          image: true,
          tags: true,
          faqs: true,
          brief: { select: { requiresLiveSource: true } },
        },
      });
      if (!row) return null;
      const { socialPosts, ...rest } = row;
      return { ...rest, social: socialPosts };
    },

    async getSocial(id) {
      const row = await db().socialPost.findUnique({
        where: { id },
        select: {
          ...socialSelect,
          blogPost: { select: { published: true, reviewState: true, publishAt: true } },
        },
      });
      if (!row) return null;
      const { blogPost, ...rest } = row;
      return { ...rest, blog: blogPost };
    },

    async findQueuedBriefByTopic(topic) {
      return db().brief.findFirst({
        where: { status: "queued", topic: { equals: topic, mode: "insensitive" } },
        select: { id: true },
      });
    },

    duplicateCheck: (input) => checkManualTopicDuplicate(input),

    async internalAllowlist() {
      return inventoryUrlAllowlist(await getSiteContentInventory());
    },

    async pastDue(now) {
      const [blogs, social, last] = await Promise.all([
        db().blogPost.findMany({
          where: { origin: "pipeline", published: false, reviewState: "approved", publishAt: { lte: now } },
          orderBy: { publishAt: "asc" },
          select: { id: true, slug: true, publishAt: true },
          take: 50,
        }),
        db().socialPost.findMany({
          where: { status: "scheduled", channel: "linkedin", scheduledFor: { lte: now } },
          orderBy: { scheduledFor: "asc" },
          select: {
            id: true,
            scheduledFor: true,
            blogPostId: true,
            blogPost: { select: { published: true, publishAt: true } },
          },
          take: 50,
        }),
        db().blogPost.findFirst({
          where: { origin: "pipeline", published: false, reviewState: "approved", publishAt: { gt: now } },
          orderBy: { publishAt: "desc" },
          select: { publishAt: true },
        }),
      ]);
      return {
        blogs: blogs.map((b) => ({ id: b.id, slug: b.slug, publishAt: b.publishAt as Date })),
        social: social.map((p) => ({
          id: p.id,
          scheduledFor: p.scheduledFor,
          blogPostId: p.blogPostId,
          blogPublished: p.blogPost?.published ?? false,
          blogPublishAt: p.blogPost?.publishAt ?? null,
        })),
        lastScheduledBlogAt: last?.publishAt ?? null,
      };
    },

    async createBrief(data, log) {
      return serial<CreateBriefResult>(
        db(),
        async (tx) => {
          // Re-checked inside the transaction so two calls cannot both insert.
          const existing = await tx.brief.findFirst({
            where: { status: "queued", topic: { equals: data.topic, mode: "insensitive" } },
            select: { id: true },
          });
          if (existing) return { ok: false as const, reason: "duplicate" as const, id: existing.id };
          const brief = await tx.brief.create({
            data: { ...data, realExample: "", status: "queued", origin: "jarvis", formatHint: "" },
          });
          await tx.generationLog.create({ data: logData({ ...log, refId: brief.id }) });
          return { ok: true as const, brief };
        },
        { ok: false as const, reason: "conflict" as const }
      );
    },

    async updateBlog(id, guard, data, log) {
      return serial(
        db(),
        async (tx) => {
          const result = await tx.blogPost.updateMany({
            where: {
              id,
              origin: "pipeline",
              published: false,
              updatedAt: guard.updatedAt,
              ...blogLinkWhere(guard.social),
            },
            data,
          });
          if (result.count !== 1) return false;
          await tx.generationLog.create({ data: logData(log) });
          return true;
        },
        false
      );
    },

    async updateSocial(id, guard: SocialGuard, data, log) {
      return serial(
        db(),
        async (tx) => {
          const result = await tx.socialPost.updateMany({
            where: {
              id,
              status: guard.status,
              scheduledFor: guard.scheduledFor,
              publishedAt: null,
              ...(guard.blogLiveBy ? socialLinkWhere(guard.blogLiveBy) : {}),
            },
            data,
          });
          if (result.count !== 1) return false;
          await tx.generationLog.create({ data: logData(log) });
          return true;
        },
        false
      );
    },

    async setPipelineControl({ expectPaused, log, reschedule }) {
      const none = { blogs: [] as Move[], social: [] as Move[] };
      return serial(
        db(),
        async (tx) => {
          const control = await getPipelineControl(tx);
          if ((control?.paused ?? false) !== expectPaused) return { ok: false, applied: none };
          const applied = { blogs: [] as Move[], social: [] as Move[] };
          for (const m of reschedule.blogs) {
            const r = await tx.blogPost.updateMany({
              where: { id: m.id, origin: "pipeline", published: false, reviewState: "approved", publishAt: m.from },
              data: { publishAt: m.to },
            });
            if (r.count === 1) {
              applied.blogs.push(m);
              await tx.generationLog.create({ data: logData(moveLog("BlogPost", m)) });
            }
          }
          for (const m of reschedule.social) {
            const r = await tx.socialPost.updateMany({
              where: { id: m.id, status: "scheduled", scheduledFor: m.from },
              data: { scheduledFor: m.to },
            });
            if (r.count === 1) {
              applied.social.push(m);
              await tx.generationLog.create({ data: logData(moveLog("SocialPost", m)) });
            }
          }
          await tx.generationLog.create({
            data: logData({
              ...log,
              meta: {
                ...log.meta,
                rescheduled: {
                  blogs: applied.blogs.map((m) => m.id),
                  social: applied.social.map((m) => m.id),
                },
              },
            }),
          });
          return { ok: true, applied };
        },
        { ok: false, applied: none }
      );
    },

    async writeLog(log) {
      await db().generationLog.create({ data: logData(log) });
    },
  };
}
