import type { Prisma, PrismaClient } from "@prisma/client";
import { requireDb } from "@/lib/cms/db";
import { remainingBriefCount } from "@/lib/pipeline/briefs";
import { createRunId } from "@/lib/pipeline/log";
import { checkManualTopicDuplicate } from "@/lib/pipeline/manual/duplicate-check";
import { getSiteContentInventory, inventoryUrlAllowlist } from "@/lib/pipeline/seo/inventory";
import { pipeline } from "@/lib/pipeline/config";
import { DEFAULT_GENERATOR, getGeneratorControl } from "@/lib/jarvis/generator";
import { JARVIS_SOURCE, JARVIS_STAGE, getPipelineControl } from "@/lib/jarvis/pause";
import { PAUSE_MARKER, blogStateOf, socialStateOf } from "@/lib/jarvis/states";
import type {
  BlogGuard,
  ControlLog,
  ControlStore,
  CreateIntakeResult,
  IntakeMatch,
  IntakeRecord,
  Move,
  Page,
  RunSummary,
  SocialGuard,
} from "@/lib/jarvis/store";
import { RESUME_BATCH } from "@/lib/jarvis/store";

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
    case "publishing":
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

/**
 * Default isolation (read committed) with explicit locks, so correctness does
 * not depend on Serializable support through Prisma Postgres / Accelerate.
 * 10 seconds stays under Accelerate's 15 second interactive limit.
 */
export const TX_OPTIONS = { timeout: 10_000, maxWait: 5_000 };

/** LinkedIn rows that count as "going out": scheduled, or claimed mid-post. */
export const LIVE_SOCIAL = ["scheduled", "publishing"];

/**
 * Errors that mean "someone else got there first, nothing was committed":
 * Prisma's write conflict or deadlock (P2034), a transaction that timed out
 * or closed (P2028), and the raw Postgres serialization and deadlock codes.
 */
export function isLockConflict(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "P2034" || code === "P2028" || code === "40001" || code === "40P01";
}

/** Guards for the cross-row LinkedIn link, evaluated inside the write. */
export function blogLinkWhere(guard: BlogGuard["social"]): Prisma.BlogPostWhereInput {
  return "noneScheduled" in guard
    ? { socialPosts: { none: { status: { in: LIVE_SOCIAL } } } }
    : {
        socialPosts: {
          none: { status: { in: LIVE_SOCIAL }, scheduledFor: { lt: guard.noneScheduledBefore } },
        },
      };
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

type Tx = Prisma.TransactionClient;

/** Lock order is always blog row, then its LinkedIn rows, so two writers cannot deadlock. */
export async function lockBlog(tx: Tx, blogId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM blog_posts WHERE id = ${blogId} FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM social_posts WHERE "blogPostId" = ${blogId} ORDER BY id FOR UPDATE`;
}

export async function lockSocial(tx: Tx, socialId: string): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ blogPostId: string | null }>>`
    SELECT "blogPostId" FROM social_posts WHERE id = ${socialId}`;
  const blogId = rows[0]?.blogPostId;
  if (blogId) await lockBlog(tx, blogId);
  else await tx.$queryRaw`SELECT id FROM social_posts WHERE id = ${socialId} FOR UPDATE`;
}

/** Transaction-scoped advisory lock on a text key (released at commit or rollback). */
export async function advisoryLock(tx: Tx, key: string): Promise<void> {
  await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${key}))) AS l`;
}

/** Run a locked write; a lock conflict or timeout means "moved". */
async function locked<T>(db: PrismaClient, fn: (tx: Tx) => Promise<T>, onConflict: T): Promise<T> {
  try {
    return await db.$transaction(fn, TX_OPTIONS);
  } catch (error) {
    if (isLockConflict(error)) return onConflict;
    throw error;
  }
}

/** refType of the generation_logs row that records an accepted intake under its key (refId). */
export const INTAKE_REF_TYPE = "Intake";

type LogFinder = { generationLog: Pick<PrismaClient["generationLog"], "findFirst"> };
type BlogFinder = { blogPost: Pick<PrismaClient["blogPost"], "findMany"> };

async function readIntake(db: LogFinder, key: string): Promise<IntakeRecord | null> {
  const row = await db.generationLog.findFirst({
    where: { stage: JARVIS_STAGE, refType: INTAKE_REF_TYPE, refId: key, status: "ok" },
    orderBy: newestFirst,
    select: { meta: true, createdAt: true },
  });
  if (!row) return null;
  const meta = (row.meta ?? {}) as Record<string, unknown>;
  return {
    key,
    payloadHash: String(meta.payloadHash ?? ""),
    blogPostId: String(meta.blogPostId ?? ""),
    socialPostId: typeof meta.socialPostId === "string" ? meta.socialPostId : null,
    gates: meta.gates ?? null,
    createdAt: row.createdAt,
  };
}

async function blogMatches(db: BlogFinder, slug: string, title: string): Promise<IntakeMatch[]> {
  const rows = await db.blogPost.findMany({
    where: { OR: [{ slug }, { title: { equals: title.trim(), mode: "insensitive" } }] },
    select: { id: true, slug: true, title: true },
    take: 5,
  });
  return rows.map((r) => ({ kind: r.slug === slug ? ("slug" as const) : ("title" as const), ...r }));
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === "P2002";
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

    generatorControl: () => getGeneratorControl(db()),

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
      const due = { origin: "pipeline", published: false, reviewState: "approved", publishAt: { lte: now } };
      const [blogs, held, social, last] = await Promise.all([
        db().blogPost.findMany({
          where: { ...due, socialPosts: { none: { status: "publishing" } } },
          orderBy: { publishAt: "asc" },
          select: {
            id: true,
            slug: true,
            publishAt: true,
            socialPosts: {
              where: { status: "scheduled" },
              orderBy: { scheduledFor: "asc" },
              select: { id: true, scheduledFor: true },
            },
          },
          take: RESUME_BATCH.blogs + 1,
        }),
        db().blogPost.findMany({
          where: { ...due, socialPosts: { some: { status: "publishing" } } },
          select: { id: true },
          take: 20,
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
          take: RESUME_BATCH.social + 1,
        }),
        db().blogPost.findFirst({
          where: { origin: "pipeline", published: false, reviewState: "approved", publishAt: { gt: now } },
          orderBy: { publishAt: "desc" },
          select: { publishAt: true },
        }),
      ]);
      return {
        blogs: blogs.slice(0, RESUME_BATCH.blogs).map((b) => ({
          id: b.id,
          slug: b.slug,
          publishAt: b.publishAt as Date,
          social: b.socialPosts,
        })),
        social: social.slice(0, RESUME_BATCH.social).map((p) => ({
          id: p.id,
          scheduledFor: p.scheduledFor,
          blogPostId: p.blogPostId,
          blogPublished: p.blogPost?.published ?? false,
          blogPublishAt: p.blogPost?.publishAt ?? null,
        })),
        lastScheduledBlogAt: last?.publishAt ?? null,
        held: held.map((b) => b.id),
        more: blogs.length > RESUME_BATCH.blogs || social.length > RESUME_BATCH.social,
      };
    },

    async createBrief(data, log) {
      return locked<CreateBriefResult>(
        db(),
        async (tx) => {
          // The advisory lock on the normalised topic makes the re-check and
          // the insert atomic: a second call for the same topic waits here.
          await advisoryLock(tx, `jarvis:brief:${data.topic.trim().toLowerCase()}`);
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
      return locked(
        db(),
        async (tx) => {
          await lockBlog(tx, id);
          if (guard.expect) {
            // Read under the lock: nothing can change the row before the update below.
            const row = await tx.blogPost.findUnique({
              where: { id },
              select: { published: true, reviewState: true, reviewReasons: true, updatedAt: true },
            });
            if (
              !row ||
              blogStateOf(row) !== guard.expect.state ||
              row.updatedAt.getTime() !== guard.expect.updatedAt.getTime()
            ) {
              return false;
            }
          }
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
      return locked(
        db(),
        async (tx) => {
          await lockSocial(tx, id);
          if (guard.expect) {
            const row = await tx.socialPost.findUnique({
              where: { id },
              select: { status: true, reviewReasons: true, scheduledFor: true },
            });
            if (
              !row ||
              socialStateOf(row) !== guard.expect.state ||
              row.scheduledFor.getTime() !== guard.expect.scheduledFor.getTime()
            ) {
              return false;
            }
          }
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

    async setPipelineControl({ expectPaused, flip, log, reschedule }) {
      const none = { blogs: [] as Move[], social: [] as Move[] };
      return locked(
        db(),
        async (tx) => {
          // One switch writer at a time; the re-read below sees the latest row.
          await advisoryLock(tx, "jarvis:pipeline-control");
          const control = await getPipelineControl(tx);
          if ((control?.paused ?? false) !== expectPaused) return { ok: false, applied: none };
          const applied = { blogs: [] as Move[], social: [] as Move[] };

          const moveSocial = async (m: Move) => {
            const r = await tx.socialPost.updateMany({
              where: { id: m.id, status: "scheduled", scheduledFor: m.from, ...socialLinkWhere(m.to) },
              data: { scheduledFor: m.to },
            });
            return r.count === 1;
          };

          for (const b of reschedule.blogs) {
            await lockBlog(tx, b.id);
            // Its LinkedIn posts first, so the guarded blog move below can pass.
            const linked = reschedule.social.filter((m) => m.blogId === b.id);
            const moved: Move[] = [];
            for (const m of linked) if (await moveSocial(m)) moved.push(m);
            const r = await tx.blogPost.updateMany({
              where: {
                id: b.id,
                origin: "pipeline",
                published: false,
                reviewState: "approved",
                publishAt: b.from,
                ...blogLinkWhere({ noneScheduledBefore: b.to }),
              },
              data: { publishAt: b.to },
            });
            if (r.count === 1) {
              applied.blogs.push(b);
              applied.social.push(...moved);
              await tx.generationLog.create({ data: logData(moveLog("BlogPost", b)) });
              for (const m of moved) await tx.generationLog.create({ data: logData(moveLog("SocialPost", m)) });
            } else {
              // The blog stays where it was, so its posts go back too.
              for (const m of moved) {
                await tx.socialPost.updateMany({
                  where: { id: m.id, status: "scheduled", scheduledFor: m.to },
                  data: { scheduledFor: m.from },
                });
              }
            }
          }

          for (const m of reschedule.social.filter((x) => !x.blogId)) {
            await lockSocial(tx, m.id);
            if (await moveSocial(m)) {
              applied.social.push(m);
              await tx.generationLog.create({ data: logData(moveLog("SocialPost", m)) });
            }
          }

          const summary = {
            blogs: applied.blogs.map((m) => m.id),
            social: applied.social.map((m) => m.id),
          };
          await tx.generationLog.create({
            data: logData(
              flip
                ? { ...log, meta: { ...log.meta, rescheduled: summary } }
                : {
                    ...log,
                    refType: "PipelineBacklog",
                    message: "Jarvis resume moved a batch of past-due work; the pipeline stays paused until the rest is moved",
                    meta: { ...log.meta, action: "resume_batch", rescheduled: summary },
                  }
            ),
          });
          return { ok: true, applied };
        },
        { ok: false, applied: none }
      );
    },

    async setGenerator({ expect, log }) {
      return locked(
        db(),
        async (tx) => {
          // One switch writer at a time; the re-read below sees the latest row.
          await advisoryLock(tx, "jarvis:pipeline-generator");
          const control = await getGeneratorControl(tx);
          if ((control?.generator ?? DEFAULT_GENERATOR) !== expect) return { ok: false };
          await tx.generationLog.create({ data: logData(log) });
          return { ok: true };
        },
        { ok: false }
      );
    },

    findIntake: (key) => readIntake(db(), key),

    findBlogMatches: ({ slug, title }) => blogMatches(db(), slug, title),

    async latestScheduledBlogAt(now) {
      const row = await db().blogPost.findFirst({
        where: { origin: "pipeline", published: false, reviewState: "approved", publishAt: { gt: now } },
        orderBy: { publishAt: "desc" },
        select: { publishAt: true },
      });
      return row?.publishAt ?? null;
    },

    async createIntake(data) {
      const slugTaken: CreateIntakeResult = {
        ok: false,
        reason: "duplicate",
        matches: [{ kind: "slug", id: "", slug: data.blog.slug, title: data.blog.title }],
      };
      try {
        return await locked<CreateIntakeResult>(
          db(),
          async (tx) => {
            // Every intake write takes this lock, so the key, slug and title
            // re-checks below and the inserts are atomic against each other.
            await advisoryLock(tx, "jarvis:intake");
            const prior = await readIntake(tx, data.key);
            if (prior) return { ok: false, reason: "replay", record: prior };
            const matches = await blogMatches(tx, data.blog.slug, data.blog.title);
            if (matches.length) return { ok: false, reason: "duplicate", matches };

            const order = await tx.blogPost.aggregate({ _max: { sortOrder: true } });
            const { faqs, reviewReasons, ...blog } = data.blog;
            const created = await tx.blogPost.create({
              data: {
                ...blog,
                faqs: faqs as Prisma.InputJsonValue,
                reviewReasons: reviewReasons as Prisma.InputJsonValue,
                published: false,
                origin: "pipeline",
                sortOrder: (order._max.sortOrder ?? 0) + 1,
                author: pipeline.defaults.author,
                authorRole: pipeline.defaults.authorRole,
                authorImage: pipeline.defaults.authorImage,
              },
              select: { id: true },
            });
            let socialPostId: string | null = null;
            if (data.social) {
              const { reviewReasons: socialReasons, ...social } = data.social;
              const post = await tx.socialPost.create({
                data: {
                  ...social,
                  reviewReasons: socialReasons as Prisma.InputJsonValue,
                  channel: "linkedin",
                  visibility: "PUBLIC",
                  blogPostId: created.id,
                },
                select: { id: true },
              });
              socialPostId = post.id;
            }

            const runId = createRunId();
            const meta = {
              ...data.log.meta,
              source: JARVIS_SOURCE,
              action: "intake",
              key: data.key,
              blogPostId: created.id,
              socialPostId,
            };
            const row = (refType: ControlLog["refType"], refId: string, message: string, extra = {}) => ({
              data: { ...logData({ refType, refId, status: "ok", message, meta: { ...meta, ...extra } }), runId },
            });
            await tx.generationLog.create(row("BlogPost", created.id, data.log.message));
            if (socialPostId) {
              await tx.generationLog.create(
                row("SocialPost", socialPostId, `Jarvis intake LinkedIn post for blog ${data.blog.slug}`)
              );
            }
            // The idempotency record: refId is the key, newest wins.
            await tx.generationLog.create(
              row("Intake", data.key, data.log.message, { payloadHash: data.payloadHash })
            );
            return { ok: true, blogPostId: created.id, socialPostId };
          },
          { ok: false, reason: "conflict" }
        );
      } catch (error) {
        // A CMS post created the slug between our check and the insert.
        if (isUniqueViolation(error)) return slugTaken;
        throw error;
      }
    },

    async writeLog(log) {
      await db().generationLog.create({ data: logData(log) });
    },
  };
}
