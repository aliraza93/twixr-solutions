import type { Prisma } from "@prisma/client";
import { requireDb } from "@/lib/cms/db";
import { remainingBriefCount } from "@/lib/pipeline/briefs";
import { createRunId } from "@/lib/pipeline/log";
import { checkManualTopicDuplicate } from "@/lib/pipeline/manual/duplicate-check";
import { getSiteContentInventory, inventoryUrlAllowlist } from "@/lib/pipeline/seo/inventory";
import { JARVIS_STAGE, getPipelineControl } from "@/lib/jarvis/pause";
import { PAUSE_MARKER } from "@/lib/jarvis/states";
import type { ControlLog, ControlStore, Page, RunSummary } from "@/lib/jarvis/store";

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

export function createPrismaControlStore(): ControlStore {
  const db = () => requireDb();

  return {
    pipelineControl: () => getPipelineControl(),

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

    async createBrief(data, log) {
      return db().$transaction(async (tx) => {
        const brief = await tx.brief.create({
          data: { ...data, realExample: "", status: "queued", origin: "jarvis", formatHint: "" },
        });
        await tx.generationLog.create({ data: logData({ ...log, refId: brief.id }) });
        return brief;
      });
    },

    async updateBlog(id, guard, data, log) {
      return db().$transaction(async (tx) => {
        const result = await tx.blogPost.updateMany({
          where: { id, origin: "pipeline", published: false, updatedAt: guard.updatedAt },
          data,
        });
        if (result.count !== 1) return false;
        await tx.generationLog.create({ data: logData(log) });
        return true;
      });
    },

    async updateSocial(id, guard, data, log) {
      return db().$transaction(async (tx) => {
        const result = await tx.socialPost.updateMany({
          where: { id, status: guard.status, scheduledFor: guard.scheduledFor, publishedAt: null },
          data,
        });
        if (result.count !== 1) return false;
        await tx.generationLog.create({ data: logData(log) });
        return true;
      });
    },

    async writeLog(log) {
      await db().generationLog.create({ data: logData(log) });
    },
  };
}
