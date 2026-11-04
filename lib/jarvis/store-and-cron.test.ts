import assert from "node:assert/strict";
import { before, beforeEach, describe, it } from "node:test";

/**
 * Prisma store conditional writes and the cron's pause and claim wiring,
 * against a recording fake Prisma client (no database). lib/prisma.ts reuses
 * globalThis.prisma when set, so the fake is installed before anything that
 * imports it is loaded (hence the dynamic imports).
 */

type Call = { model: string; op: string; args: unknown };

class FakePrisma {
  calls: Call[] = [];
  txOptions: unknown[] = [];
  /** Per "model.op" handler; default returns an empty, harmless value. */
  handlers: Record<string, (args: unknown) => unknown> = {};
  txError: unknown = null;

  constructor() {
    return new Proxy(this, {
      get: (target, prop: string) => {
        if (prop in target) return (target as unknown as Record<string, unknown>)[prop];
        return target.delegate(prop);
      },
    });
  }

  delegate(model: string) {
    return new Proxy(
      {},
      {
        get: (_t, op: string) => async (args: unknown) => {
          this.calls.push({ model, op, args });
          const h = this.handlers[`${model}.${op}`];
          if (h) return h(args);
          if (op === "findMany" || op === "groupBy") return [];
          if (op === "updateMany" || op === "deleteMany") return { count: 0 };
          if (op === "count") return 0;
          if (op === "create" || op === "update") return { id: "new1", ...((args as { data?: object })?.data ?? {}) };
          return null;
        },
      }
    );
  }

  /** Tagged-template raw SQL: recorded as model "$raw" with the SQL text as op. */
  rawHandler: (sql: string, values: unknown[]) => unknown = () => [];
  async $queryRaw(strings: TemplateStringsArray, ...values: unknown[]) {
    const sql = strings.join("?").replace(/\s+/g, " ").trim();
    this.calls.push({ model: "$raw", op: sql, args: values });
    return this.rawHandler(sql, values);
  }

  raw() {
    return this.calls.filter((c) => c.model === "$raw");
  }

  async $transaction(fn: (tx: unknown) => Promise<unknown>, options?: unknown) {
    this.txOptions.push(options);
    if (this.txError) throw this.txError;
    return fn(this);
  }

  of(model: string, op: string) {
    return this.calls.filter((c) => c.model === model && c.op === op);
  }

  reset() {
    this.calls = [];
    this.txOptions = [];
    this.handlers = {};
    this.txError = null;
    this.rawHandler = () => [];
  }
}

const fake = new FakePrisma();
/** LinkedIn's answer for the next post; default is a refusal. */
let linkedInReply: () => Response = () => new Response("nope", { status: 500 });
const NOW = new Date();
const HOUR = 3600_000;

type Mods = {
  store: typeof import("@/lib/jarvis/prisma-store");
  pause: typeof import("@/lib/jarvis/pause");
  generator: typeof import("@/lib/jarvis/generator");
  publishDue: typeof import("@/lib/pipeline/run-publish-due");
  publishLi: typeof import("@/lib/pipeline/run-publish-linkedin");
  generate: typeof import("@/lib/pipeline/run-generate");
  tick: typeof import("@/app/api/cron/tick/route");
  cronGenerate: typeof import("@/app/api/cron/generate/route");
  cronLinkedin: typeof import("@/app/api/cron/publish-linkedin/route");
};
let m: Mods;

const log = { refType: "BlogPost" as const, refId: "b1", status: "ok" as const, message: "m", meta: { source: "jarvis" } };

before(async () => {
  process.env.DATABASE_URL = "postgresql://fake:fake@127.0.0.1:1/fake";
  process.env.CRON_SECRET = "cron-secret-for-tests";
  // Credentials so the LinkedIn client reaches fetch, which is stubbed below.
  process.env.LINKEDIN_ACCESS_TOKEN = "test-token";
  process.env.LINKEDIN_PERSON_URN = "urn:li:person:test";
  globalThis.fetch = (async () => linkedInReply()) as typeof fetch;
  (globalThis as unknown as { prisma: unknown }).prisma = fake;
  m = {
    store: await import("@/lib/jarvis/prisma-store"),
    pause: await import("@/lib/jarvis/pause"),
    generator: await import("@/lib/jarvis/generator"),
    publishDue: await import("@/lib/pipeline/run-publish-due"),
    publishLi: await import("@/lib/pipeline/run-publish-linkedin"),
    generate: await import("@/lib/pipeline/run-generate"),
    tick: await import("@/app/api/cron/tick/route"),
    cronGenerate: await import("@/app/api/cron/generate/route"),
    cronLinkedin: await import("@/app/api/cron/publish-linkedin/route"),
  };
});

beforeEach(() => {
  fake.reset();
  linkedInReply = () => new Response("nope", { status: 500 });
});

const TX = { timeout: 10_000, maxWait: 5_000 };
type NewIntake = import("@/lib/jarvis/store").NewIntake;

const store = () => m.store.createPrismaControlStore(() => fake as never);

describe("prisma store: guarded writes", () => {
  it("updateBlog to scheduled guards on updatedAt and no earlier live LinkedIn post, under row locks", async () => {
    fake.handlers["blogPost.updateMany"] = () => ({ count: 1 });
    const at = new Date(NOW.getTime() + 5 * HOUR);
    const updatedAt = new Date(NOW.getTime() - HOUR);
    const ok = await store().updateBlog(
      "b1",
      { updatedAt, social: { noneScheduledBefore: at } },
      { reviewState: "approved", reviewReasons: [], publishAt: at },
      log
    );
    assert.equal(ok, true);
    const where = (fake.of("blogPost", "updateMany")[0].args as { where: Record<string, unknown> }).where;
    assert.deepEqual(where, {
      id: "b1",
      origin: "pipeline",
      published: false,
      updatedAt,
      socialPosts: { none: { status: { in: ["scheduled", "publishing"] }, scheduledFor: { lt: at } } },
    });
    const raw = fake.raw().map((c) => c.op);
    assert.match(raw[0], /FROM blog_posts WHERE id = \? FOR UPDATE/);
    assert.match(raw[1], /FROM social_posts WHERE "blogPostId" = \? ORDER BY id FOR UPDATE/);
    assert.ok(
      fake.calls.findIndex((c) => c.model === "$raw") < fake.calls.findIndex((c) => c.op === "updateMany"),
      "locks come before the write"
    );
    assert.deepEqual(fake.txOptions[0], TX);
    assert.equal(fake.of("generationLog", "create").length, 1);
  });

  it("updateBlog pause guards on no scheduled LinkedIn post at all", async () => {
    await store().updateBlog(
      "b1",
      { updatedAt: NOW, social: { noneScheduled: true } },
      { reviewState: "needs_review", reviewReasons: ["Paused by Jarvis"], publishAt: null },
      log
    );
    const where = (fake.of("blogPost", "updateMany")[0].args as { where: Record<string, unknown> }).where;
    assert.deepEqual(where.socialPosts, { none: { status: { in: ["scheduled", "publishing"] } } });
  });

  it("a guarded write that matches nothing writes no log and reports false", async () => {
    const ok = await store().updateBlog(
      "b1",
      { updatedAt: NOW, social: { noneScheduled: true } },
      { reviewState: "needs_review", reviewReasons: [], publishAt: null },
      log
    );
    assert.equal(ok, false);
    assert.equal(fake.of("generationLog", "create").length, 0);
  });

  it("a lock conflict or timeout reports false; other errors throw", async () => {
    fake.txError = Object.assign(new Error("transaction timed out"), { code: "P2028" });
    assert.equal(
      await store().updateBlog(
        "b1",
        { updatedAt: NOW, social: { noneScheduled: true } },
        { reviewState: "needs_review", reviewReasons: [], publishAt: null },
        log
      ),
      false
    );
    fake.txError = Object.assign(new Error("deadlock"), { code: "P2034" });
    const write = () =>
      store().updateBlog(
        "b1",
        { updatedAt: NOW, social: { noneScheduled: true } },
        { reviewState: "needs_review", reviewReasons: [], publishAt: null },
        log
      );
    assert.equal(await write(), false);
    fake.txError = new Error("connection lost");
    await assert.rejects(write, /connection lost/);
  });

  it("updateBlog with expect reads the row after the locks and writes only if it still matches", async () => {
    const updatedAt = new Date(NOW.getTime() - HOUR);
    const at = new Date(NOW.getTime() + 5 * HOUR);
    const write = () =>
      store().updateBlog(
        "b1",
        { updatedAt, expect: { state: "needs_review", updatedAt }, social: { noneScheduledBefore: at } },
        { reviewState: "approved", reviewReasons: [], publishAt: at },
        log
      );
    fake.handlers["blogPost.updateMany"] = () => ({ count: 1 });
    fake.handlers["blogPost.findUnique"] = () => ({ published: false, reviewState: "needs_review", reviewReasons: ["Paused by Jarvis"], updatedAt });
    assert.equal(await write(), false, "paused is not needs_review");
    assert.equal(fake.of("blogPost", "updateMany").length, 0);
    assert.equal(fake.of("generationLog", "create").length, 0);

    fake.reset();
    fake.handlers["blogPost.updateMany"] = () => ({ count: 1 });
    fake.handlers["blogPost.findUnique"] = () => ({ published: false, reviewState: "needs_review", reviewReasons: [], updatedAt });
    assert.equal(await write(), true);
    const order = fake.calls.map((c) => (c.model === "$raw" ? "lock" : `${c.model}.${c.op}`));
    assert.deepEqual(order.slice(0, 4), ["lock", "lock", "blogPost.findUnique", "blogPost.updateMany"]);
  });

  it("updateSocial with expect compares the derived state and time under the lock", async () => {
    const was = new Date(NOW.getTime() - HOUR);
    const write = () =>
      store().updateSocial(
        "li1",
        { status: "scheduled", scheduledFor: was, expect: { state: "scheduled", scheduledFor: was } },
        { status: "needs_review", reviewReasons: ["Paused by Jarvis"], scheduledFor: was },
        { ...log, refType: "SocialPost", refId: "li1" }
      );
    fake.handlers["socialPost.updateMany"] = () => ({ count: 1 });
    fake.handlers["socialPost.findUnique"] = () => ({ status: "scheduled", reviewReasons: [], scheduledFor: new Date(was.getTime() + 1) });
    assert.equal(await write(), false);
    assert.equal(fake.of("socialPost", "updateMany").length, 0);
    fake.handlers["socialPost.findUnique"] = () => ({ status: "scheduled", reviewReasons: [], scheduledFor: was });
    assert.equal(await write(), true);
    assert.equal(fake.of("socialPost", "updateMany").length, 1);
  });

  it("updateBlog without expect does not read the row first", async () => {
    await store().updateBlog(
      "b1",
      { updatedAt: NOW, social: { noneScheduled: true } },
      { reviewState: "needs_review", reviewReasons: [], publishAt: null },
      log
    );
    assert.equal(fake.of("blogPost", "findUnique").length, 0);
  });

  it("updateSocial to scheduled locks its blog first and guards on the blog being live by then", async () => {
    fake.handlers["socialPost.updateMany"] = () => ({ count: 1 });
    fake.rawHandler = (sql) => (sql.startsWith('SELECT "blogPostId"') ? [{ blogPostId: "b1" }] : []);
    const at = new Date(NOW.getTime() + 8 * HOUR);
    const was = new Date(NOW.getTime() - HOUR);
    const ok = await store().updateSocial(
      "li1",
      { status: "needs_review", scheduledFor: was, blogLiveBy: at },
      { status: "scheduled", reviewReasons: [], scheduledFor: at },
      { ...log, refType: "SocialPost", refId: "li1" }
    );
    assert.equal(ok, true);
    const where = (fake.of("socialPost", "updateMany")[0].args as { where: Record<string, unknown> }).where;
    assert.deepEqual(where, {
      id: "li1",
      status: "needs_review",
      scheduledFor: was,
      publishedAt: null,
      OR: [
        { blogPostId: null },
        { blogPost: { published: true } },
        { blogPost: { reviewState: "approved", publishAt: { lte: at } } },
      ],
    });
    assert.deepEqual(fake.txOptions[0], TX);
    const raw = fake.raw();
    assert.deepEqual(raw[1].args, ["b1"]);
    assert.match(raw[1].op, /FROM blog_posts WHERE id = \? FOR UPDATE/);
    assert.match(raw[2].op, /FROM social_posts WHERE "blogPostId" = \?/);
  });

  it("createBrief takes an advisory lock on the topic, then re-checks inside the transaction", async () => {
    fake.handlers["brief.findFirst"] = () => ({ id: "existing" });
    const result = await store().createBrief(
      {
        pillar: "Build",
        topic: "Laravel queue retries",
        targetKeyword: "x",
        angle: "",
        requiresLiveSource: false,
        scheduledFor: null,
        sourceUrl: "",
        extraInstructions: "",
      },
      { refType: "Brief", status: "ok", message: "m", meta: {} }
    );
    assert.deepEqual(result, { ok: false, reason: "duplicate", id: "existing" });
    const lock = fake.raw()[0];
    assert.match(lock.op, /pg_advisory_xact_lock\(hashtext\(\?\)\)/);
    assert.deepEqual(lock.args, ["jarvis:brief:laravel queue retries"]);
    assert.equal(fake.of("brief", "create").length, 0);
    assert.deepEqual(fake.txOptions[0], TX);
  });

  it("setPipelineControl refuses when the switch moved, else moves rows still at their old time", async () => {
    fake.handlers["generationLog.findFirst"] = () => ({ createdAt: NOW, meta: { action: "resume" } });
    const pipelineLog = { refType: "Pipeline" as const, refId: "pipeline", status: "ok" as const, message: "m", meta: { action: "resume" } };
    const from = new Date(NOW.getTime() - HOUR);
    const to = new Date(NOW.getTime() + 20 * HOUR);
    const reschedule = { blogs: [{ id: "b1", from, to }], social: [{ id: "li1", from, to }] };

    const refused = await store().setPipelineControl({ expectPaused: true, flip: true, log: pipelineLog, reschedule });
    assert.equal(refused.ok, false);
    assert.equal(fake.of("blogPost", "updateMany").length, 0);
    assert.equal(fake.of("generationLog", "create").length, 0);

    fake.reset();
    fake.handlers["generationLog.findFirst"] = () => ({ createdAt: NOW, meta: { action: "pause" } });
    fake.handlers["blogPost.updateMany"] = () => ({ count: 1 });
    fake.handlers["socialPost.updateMany"] = () => ({ count: 0 });
    const done = await store().setPipelineControl({ expectPaused: true, flip: true, log: pipelineLog, reschedule });
    assert.equal(done.ok, true);
    assert.deepEqual(done.applied.blogs.map((x) => x.id), ["b1"]);
    assert.deepEqual(done.applied.social, []);
    const blogWhere = (fake.of("blogPost", "updateMany")[0].args as { where: Record<string, unknown> }).where;
    assert.equal(blogWhere.publishAt, from);
    assert.equal(blogWhere.reviewState, "approved");
    // one reschedule row plus the pipeline row
    assert.equal(fake.of("generationLog", "create").length, 2);
    const read = fake.of("generationLog", "findFirst")[0].args as { orderBy: unknown };
    assert.deepEqual(read.orderBy, [{ createdAt: "desc" }, { id: "desc" }]);
  });
});

describe("cron: pause wiring", () => {
  const paused = () => {
    fake.handlers["generationLog.findFirst"] = () => ({ createdAt: NOW, meta: { action: "pause" } });
  };

  it("runPublishDue skips while paused and touches no posts", async () => {
    paused();
    const r = await m.publishDue.runPublishDue();
    assert.equal(r.status, "skip");
    assert.match(r.message, /paused from Jarvis/);
    assert.equal(fake.of("blogPost", "findMany").length, 0);
  });

  it("runPublishLinkedin skips while paused", async () => {
    paused();
    const r = await m.publishLi.runPublishLinkedin();
    assert.equal(r.status, "skip");
    assert.equal(fake.of("socialPost", "findFirst").length, 0);
  });

  it("runGenerate skips while paused", async () => {
    paused();
    const r = await m.generate.runGenerate({ force: true });
    assert.equal(r.status, "skip");
    assert.match(r.message, /paused/i);
  });

  it("the tick does not draw or claim today's plan while paused", async () => {
    paused();
    const res = await m.tick.GET(
      new Request("https://twixrsolutions.com/api/cron/tick", { headers: { authorization: "Bearer cron-secret-for-tests" } })
    );
    const body = (await res.json()) as { generate: string };
    assert.equal(body.generate, "paused from Jarvis");
    assert.equal(fake.of("pipelineDay", "findUnique").length, 0);
    assert.equal(fake.of("pipelineDay", "create").length, 0);
  });

  it("a failed pause read fails closed for the cron", async () => {
    fake.handlers["generationLog.findFirst"] = () => {
      throw new Error("db down");
    };
    assert.equal(await m.pause.isPipelinePaused(), true);
    assert.equal((await m.publishDue.runPublishDue()).status, "skip");
  });
});

describe("cron: conditional publish and LinkedIn claim", () => {
  it("publishDueBlogs flips only rows still approved and unpublished", async () => {
    fake.handlers["blogPost.findMany"] = () => [{ id: "b1", slug: "b1", publishAt: new Date(NOW.getTime() - HOUR) }];
    fake.handlers["blogPost.updateMany"] = () => ({ count: 0 });
    const n = await m.publishDue.publishDueBlogs({ runId: "r1" });
    assert.equal(n, 0);
    const where = (fake.of("blogPost", "updateMany")[0].args as { where: Record<string, unknown> }).where;
    assert.equal(where.id, "b1");
    assert.equal(where.reviewState, "approved");
    assert.equal(where.published, false);
    assert.equal(fake.of("blogPost", "update").length, 0, "no unconditional update");
  });

  const due = () => ({
    id: "li1",
    body: `A queue retry saved a release this week. ${"The worker retried after the lock cleared. ".repeat(6)}`,
    imageUrl: "",
    visibility: "PUBLIC",
    status: "scheduled",
    channel: "linkedin",
    scheduledFor: new Date(NOW.getTime() - HOUR),
  });

  it("does nothing when the claim loses (paused or taken after the read)", async () => {
    fake.handlers["socialPost.findFirst"] = () => due();
    fake.handlers["socialPost.updateMany"] = () => ({ count: 0 });
    const r = await m.publishLi.runPublishLinkedin();
    assert.equal(r.status, "skip");
    assert.equal(r.message, "Post changed before claim");
    const claim = (fake.of("socialPost", "updateMany")[0].args as { where: Record<string, unknown>; data: unknown });
    assert.equal(claim.where.status, "scheduled");
    assert.deepEqual(claim.data, { status: "publishing" });
    assert.equal(fake.of("socialPost", "update").length, 0, "no status written");
  });

  it("claims before posting and marks a LinkedIn refusal as failed", async () => {
    fake.handlers["socialPost.findFirst"] = () => due();
    fake.handlers["socialPost.updateMany"] = () => ({ count: 1 });
    // No LinkedIn token in tests, so the client refuses without a network call.
    const r = await m.publishLi.runPublishLinkedin();
    assert.equal(r.status, "fail");
    const order = fake.calls.filter((c) => c.model === "socialPost").map((c) => c.op);
    assert.deepEqual(order.slice(0, 2), ["findFirst", "updateMany"], "claim comes first");
    const failed = fake.of("socialPost", "update")[0].args as { data: { status: string } };
    assert.equal(failed.data.status, "failed");
  });

  it("hands a claimed, never-posted row back on an error", async () => {
    const row = due();
    Object.defineProperty(row, "body", {
      get() {
        throw new Error("boom before posting");
      },
    });
    fake.handlers["socialPost.findFirst"] = () => row;
    fake.handlers["socialPost.updateMany"] = () => ({ count: 1 });
    const r = await m.publishLi.runPublishLinkedin();
    assert.equal(r.status, "fail");
    const updates = fake.of("socialPost", "updateMany").map((c) => c.args as { where: Record<string, unknown>; data: unknown });
    assert.equal(updates.length, 2);
    assert.deepEqual(updates[1].where, { id: "li1", status: "publishing" });
    assert.deepEqual(updates[1].data, { status: "scheduled" });
  });

  it("a dry run never claims", async () => {
    fake.handlers["socialPost.findFirst"] = () => due();
    const r = await m.publishLi.runPublishLinkedin({ dryRun: true });
    assert.equal(r.status, "ok");
    assert.equal(fake.of("socialPost", "updateMany").length, 0);
  });
});

describe("prisma store: resume moves each blog with its LinkedIn posts", () => {
  const pipelineLog = { refType: "Pipeline" as const, refId: "pipeline", status: "ok" as const, message: "m", meta: { action: "resume" } };
  const blogFrom = new Date(NOW.getTime() - HOUR);
  const blogTo = new Date(NOW.getTime() + 20 * HOUR);
  const liFrom = new Date(NOW.getTime() + 12 * HOUR);
  const liTo = new Date(NOW.getTime() + 50 * HOUR);
  const reschedule = {
    blogs: [{ id: "b1", from: blogFrom, to: blogTo }],
    social: [{ id: "li1", from: liFrom, to: liTo, blogId: "b1" }],
  };
  const pausedRow = () => {
    fake.handlers["generationLog.findFirst"] = () => ({ createdAt: NOW, meta: { action: "pause" } });
  };

  it("locks, moves the post, then the blog guarded on no live post before its new time", async () => {
    pausedRow();
    fake.handlers["socialPost.updateMany"] = () => ({ count: 1 });
    fake.handlers["blogPost.updateMany"] = () => ({ count: 1 });
    const r = await store().setPipelineControl({ expectPaused: true, flip: true, log: pipelineLog, reschedule });
    assert.equal(r.ok, true);
    assert.deepEqual(r.applied.social.map((m) => m.id), ["li1"]);
    assert.equal(fake.txOptions.length, 1, "one transaction");
    assert.deepEqual(fake.txOptions[0], TX);

    const ops = fake.calls.map((c) => (c.model === "$raw" ? c.op : `${c.model}.${c.op}`));
    const iLock = ops.findIndex((o) => o.includes("FROM blog_posts WHERE id"));
    const iSocial = ops.indexOf("socialPost.updateMany");
    const iBlog = ops.indexOf("blogPost.updateMany");
    assert.ok(ops[0].includes("pg_advisory_xact_lock"), "switch lock first");
    assert.ok(iLock < iSocial && iSocial < iBlog, ops.join(" | "));

    const socialWhere = (fake.of("socialPost", "updateMany")[0].args as { where: Record<string, unknown> }).where;
    assert.equal(socialWhere.scheduledFor, liFrom);
    assert.ok(Array.isArray(socialWhere.OR), "social move carries the blog-live guard");
    const blogWhere = (fake.of("blogPost", "updateMany")[0].args as { where: Record<string, unknown> }).where;
    assert.deepEqual(blogWhere.socialPosts, {
      none: { status: { in: ["scheduled", "publishing"] }, scheduledFor: { lt: blogTo } },
    });
  });

  it("if the blog does not move, its posts go back", async () => {
    pausedRow();
    fake.handlers["socialPost.updateMany"] = () => ({ count: 1 });
    fake.handlers["blogPost.updateMany"] = () => ({ count: 0 });
    const r = await store().setPipelineControl({ expectPaused: true, flip: true, log: pipelineLog, reschedule });
    assert.deepEqual(r.applied, { blogs: [], social: [] });
    const moves = fake.of("socialPost", "updateMany").map((c) => c.args as { where: Record<string, unknown>; data: unknown });
    assert.equal(moves.length, 2);
    assert.equal(moves[1].where.scheduledFor, liTo);
    assert.deepEqual(moves[1].data, { scheduledFor: liFrom });
  });

  it("a partial batch logs as backlog and does not flip the switch", async () => {
    pausedRow();
    await store().setPipelineControl({ expectPaused: true, flip: false, log: pipelineLog, reschedule: { blogs: [], social: [] } });
    const row = (fake.of("generationLog", "create")[0].args as { data: { refType: string; meta: { action: string } } }).data;
    assert.equal(row.refType, "PipelineBacklog");
    assert.equal(row.meta.action, "resume_batch");
  });

  it("pastDue caps the batch and reports more", async () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `b${i}`, slug: `b${i}`, publishAt: NOW, socialPosts: [] }));
    fake.handlers["blogPost.findMany"] = (args) =>
      (args as { where: { socialPosts?: { some?: unknown } } }).where.socialPosts?.some ? [{ id: "held1" }] : many(11);
    const due = await store().pastDue(NOW);
    assert.equal(due.blogs.length, 10);
    assert.equal(due.more, true);
    assert.deepEqual(due.held, ["held1"]);
    const first = fake.of("blogPost", "findMany")[0].args as { select: { socialPosts: { where: unknown } } };
    assert.deepEqual(first.select.socialPosts.where, { status: "scheduled" }, "every scheduled post of the blog, any time");
  });
});

describe("cron: stuck claims and an unrecorded post", () => {
  it("moves publishing rows older than 15 minutes to review, never back to scheduled", async () => {
    fake.handlers["socialPost.findMany"] = () => [{ id: "li9" }];
    fake.handlers["socialPost.updateMany"] = () => ({ count: 1 });
    const n = await m.publishLi.recoverStuckPublishing(NOW);
    assert.equal(n, 1);
    const find = fake.of("socialPost", "findMany")[0].args as { where: { status: string; scheduledFor: { lt: Date } } };
    assert.equal(find.where.status, "publishing");
    assert.equal(find.where.scheduledFor.lt.getTime(), NOW.getTime() - 15 * 60_000);
    const upd = fake.of("socialPost", "updateMany")[0].args as { where: Record<string, unknown>; data: Record<string, unknown> };
    assert.equal(upd.where.status, "publishing");
    assert.equal(upd.data.status, "needs_review");
    assert.deepEqual(upd.data.reviewReasons, [m.publishLi.STUCK_CLAIM_REASON]);
    const logged = fake.of("generationLog", "create")[0].args as { data: { status: string; refId: string } };
    assert.equal(logged.data.status, "warn");
    assert.equal(logged.data.refId, "li9");
  });

  it("the tick runs the sweep even while paused", async () => {
    fake.handlers["generationLog.findFirst"] = () => ({ createdAt: NOW, meta: { action: "pause" } });
    await m.tick.GET(
      new Request("https://twixrsolutions.com/api/cron/tick", { headers: { authorization: "Bearer cron-secret-for-tests" } })
    );
    const sweep = fake.of("socialPost", "findMany").find((c) => (c.args as { where: { status?: string } }).where.status === "publishing");
    assert.ok(sweep);
  });

  it("logs, does not swallow, a failed write after LinkedIn accepted the post", async () => {
    linkedInReply = () => new Response("{}", { status: 201, headers: { "x-restli-id": "urn:li:share:1" } });
    fake.handlers["socialPost.findFirst"] = () => ({
      id: "li1",
      body: `A queue retry saved a release this week. ${"The worker retried after the lock cleared. ".repeat(6)}`,
      imageUrl: "",
      visibility: "PUBLIC",
      status: "scheduled",
      channel: "linkedin",
      scheduledFor: new Date(NOW.getTime() - HOUR),
    });
    fake.handlers["socialPost.updateMany"] = () => ({ count: 1 });
    fake.handlers["socialPost.update"] = () => {
      throw new Error("connection reset");
    };
    const r = await m.publishLi.runPublishLinkedin();
    assert.equal(r.status, "fail");
    assert.equal(r.externalId, "urn:li:share:1");
    const logs = fake.of("generationLog", "create").map((c) => (c.args as { data: { status: string; message: string } }).data);
    assert.ok(logs.some((l) => l.status === "fail" && /status write failed: connection reset/.test(l.message)));
    // never released back to the queue
    const releases = fake.of("socialPost", "updateMany").filter((c) => (c.args as { data: { status?: string } }).data.status === "scheduled");
    assert.equal(releases.length, 0);
  });
});

describe("cron routes: CRON_SECRET", () => {
  const routes = () => [
    ["tick", m.tick.GET],
    ["generate", m.cronGenerate.GET],
    ["publish-linkedin", m.cronLinkedin.GET],
  ] as const;
  const call = (handler: (req: Request) => Promise<Response>, auth?: string) =>
    handler(
      new Request("https://twixrsolutions.com/api/cron/x?dryRun=1", auth === undefined ? {} : { headers: { authorization: auth } })
    );

  it("refuses a wrong, missing or differently cased bearer and touches nothing", async () => {
    for (const [name, handler] of routes()) {
      for (const auth of [undefined, "Bearer wrong-secret-for-tests", "bearer cron-secret-for-tests", "cron-secret-for-tests"]) {
        const res = await call(handler, auth);
        assert.equal(res.status, 401, `${name} with ${auth}`);
      }
    }
    assert.equal(fake.calls.length, 0);
  });

  it("accepts the exact bearer", async () => {
    for (const [name, handler] of routes()) {
      const res = await call(handler, "Bearer cron-secret-for-tests");
      assert.equal(res.status, 200, name);
    }
  });

  it("refuses everything, even Bearer undefined, when the secret is unset or blank", async () => {
    const saved = process.env.CRON_SECRET;
    const originalError = console.error;
    console.error = () => undefined;
    try {
      for (const secret of [undefined, "", "   "]) {
        if (secret === undefined) delete process.env.CRON_SECRET;
        else process.env.CRON_SECRET = secret;
        for (const [name, handler] of routes()) {
          for (const auth of ["Bearer undefined", `Bearer ${secret ?? ""}`, "Bearer ", "Bearer null"]) {
            const res = await call(handler, auth);
            assert.equal(res.status, 401, `${name} with secret ${JSON.stringify(secret)} and ${auth}`);
          }
        }
      }
      assert.equal(fake.calls.length, 0);
    } finally {
      process.env.CRON_SECRET = saved;
      console.error = originalError;
    }
  });

  it("accepts a short secret, so a short live value keeps publishing", async () => {
    const saved = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "short";
    try {
      for (const [name, handler] of routes()) {
        assert.equal((await call(handler, "Bearer short")).status, 200, name);
        assert.equal((await call(handler, "Bearer undefined")).status, 401, name);
      }
    } finally {
      process.env.CRON_SECRET = saved;
    }
  });
});

/* ------------------------------------------------------------------ */
/* Generator switch and intake (JV-52b)                                */
/* ------------------------------------------------------------------ */

/** Control reads by refType: the pause row and the generator row are separate. */
function controlRows(rows: { pause?: unknown; generator?: unknown; generatorError?: boolean; intake?: unknown }) {
  fake.handlers["generationLog.findFirst"] = (args) => {
    const where = (args as { where: { refType?: string } }).where;
    if (where.refType === "Pipeline") return rows.pause ?? null;
    if (where.refType === "Intake") return rows.intake ?? null;
    if (where.refType === "PipelineGenerator") {
      if (rows.generatorError) throw new Error("db down");
      return rows.generator ?? null;
    }
    return null;
  };
}

const jarvisGenerates = { createdAt: NOW, meta: { action: "set_generator", generator: "jarvis" } };
const tickReq = () =>
  new Request("https://twixrsolutions.com/api/cron/tick", { headers: { authorization: "Bearer cron-secret-for-tests" } });
const generateReq = () =>
  new Request("https://twixrsolutions.com/api/cron/generate?force=1", {
    headers: { authorization: "Bearer cron-secret-for-tests" },
  });
/** publishDueBlogs read the due blogs: publishing ran. */
const publishRan = () =>
  fake.of("blogPost", "findMany").some((c) => {
    const where = (c.args as { where?: Record<string, unknown> }).where ?? {};
    return where.reviewState === "approved" && where.published === false && "publishAt" in where;
  });

describe("cron: generator switch", () => {
  it("getGeneratorControl reads the newest generator row and refuses a row without a valid value", async () => {
    controlRows({ generator: jarvisGenerates });
    const c = await m.generator.getGeneratorControl(fake as never);
    assert.equal(c?.generator, "jarvis");
    const read = fake.of("generationLog", "findFirst")[0].args as { where: unknown; orderBy: unknown };
    assert.deepEqual(read.where, { stage: "jarvis", refType: "PipelineGenerator", status: "ok" });
    assert.deepEqual(read.orderBy, [{ createdAt: "desc" }, { id: "desc" }]);
    controlRows({ generator: { createdAt: NOW, meta: { generator: "both" } } });
    await assert.rejects(m.generator.getGeneratorControl(fake as never), /no valid generator/);
  });

  it("runGenerate writes nothing while Jarvis generates, and logs the skip", async () => {
    controlRows({ generator: jarvisGenerates });
    const r = await m.generate.runGenerate({ force: true });
    assert.equal(r.status, "skip");
    assert.equal(r.message, "Generation handed to Jarvis");
    assert.equal(fake.calls.filter((c) => c.model === "brief").length, 0, "no brief taken");
    assert.equal(fake.calls.filter((c) => c.model === "blogPost" && c.op !== "findMany").length, 0, "no post written");
    const skip = fake.of("generationLog", "create").map((c) => (c.args as { data: { status: string; message: string } }).data);
    assert.deepEqual(skip.map((d) => [d.status, d.message]), [["skip", "Generation handed to Jarvis"]]);
  });

  it("the tick keeps publishing but neither draws nor claims the plan while Jarvis generates", async () => {
    controlRows({ generator: jarvisGenerates });
    const res = await m.tick.GET(tickReq());
    const body = (await res.json()) as { generate: string; plan: unknown; due: { message: string } };
    assert.equal(body.generate, "Generation handed to Jarvis");
    assert.equal(body.plan, null);
    assert.doesNotMatch(body.due.message, /paused/);
    assert.ok(publishRan(), "publish-due ran");
    assert.ok(fake.of("socialPost", "findFirst").length > 0, "the LinkedIn publisher ran");
    assert.equal(fake.of("pipelineDay", "findUnique").length, 0);
    assert.equal(fake.of("pipelineDay", "create").length, 0);
    assert.equal(fake.of("pipelineDay", "updateMany").length, 0);
  });

  it("a failed generator read fails closed: no generation, publishing continues", async () => {
    const originalError = console.error;
    console.error = () => undefined;
    try {
      controlRows({ generatorError: true });
      const res = await m.tick.GET(tickReq());
      const body = (await res.json()) as { generate: string };
      assert.match(body.generate, /unreadable; generation skipped, publishing continues/);
      assert.ok(publishRan());
      assert.equal(fake.of("pipelineDay", "findUnique").length, 0);

      fake.reset();
      controlRows({ generatorError: true });
      const r = await m.generate.runGenerate({ force: true });
      assert.equal(r.status, "skip");
      assert.equal(fake.calls.filter((c) => c.model === "brief").length, 0);
    } finally {
      console.error = originalError;
    }
  });

  it("/api/cron/generate?force=1 publishes due work but generates nothing while Jarvis generates", async () => {
    controlRows({ generator: jarvisGenerates });
    const res = await m.cronGenerate.GET(generateReq());
    const body = (await res.json()) as { generate: { status: string; message: string }; due: { message: string } };
    assert.equal(body.generate.status, "skip");
    assert.equal(body.generate.message, "Generation handed to Jarvis");
    assert.doesNotMatch(body.due.message, /paused/);
    assert.ok(publishRan());
    assert.equal(fake.calls.filter((c) => c.model === "brief").length, 0);
  });

  it("with the site as generator the tick goes on to the day plan as before", async () => {
    controlRows({ generator: { createdAt: NOW, meta: { action: "set_generator", generator: "site" } } });
    const res = await m.tick.GET(
      new Request("https://twixrsolutions.com/api/cron/tick?dryRun=1", { headers: { authorization: "Bearer cron-secret-for-tests" } })
    );
    const body = (await res.json()) as { generate: string };
    assert.equal(body.generate, "skipped (dryRun)");
    assert.ok(fake.of("pipelineDay", "findUnique").length > 0, "the plan was read");
  });

  it("a pause still wins over the generator: nothing publishes", async () => {
    controlRows({ pause: { createdAt: NOW, meta: { action: "pause" } }, generator: jarvisGenerates });
    const body = (await (await m.tick.GET(tickReq())).json()) as { generate: string };
    assert.equal(body.generate, "paused from Jarvis");
    assert.equal(publishRan(), false);
  });
});

describe("prisma store: generator switch and intake", () => {
  const genLog = {
    refType: "PipelineGenerator" as const,
    refId: "generator",
    status: "ok" as const,
    message: "m",
    meta: { action: "set_generator", generator: "jarvis" },
  };

  it("setGenerator takes its advisory lock, re-reads, and writes only if unchanged", async () => {
    controlRows({ generator: jarvisGenerates });
    assert.deepEqual(await store().setGenerator({ expect: "site", log: genLog }), { ok: false });
    assert.equal(fake.of("generationLog", "create").length, 0);
    assert.deepEqual(fake.raw()[0].args, ["jarvis:pipeline-generator"]);

    fake.reset();
    controlRows({});
    assert.deepEqual(await store().setGenerator({ expect: "site", log: genLog }), { ok: true });
    const row = (fake.of("generationLog", "create")[0].args as { data: Record<string, unknown> }).data;
    assert.equal(row.stage, "jarvis");
    assert.equal(row.refType, "PipelineGenerator");
    assert.deepEqual(fake.txOptions[0], TX);
  });

  const intakeData = (social = true, limits: Partial<NewIntake["limits"]> = {}): NewIntake => ({
    key: "jv-content-01JBXK2M3N",
    payloadHash: "hash1",
    blog: {
      slug: "laravel-queue-retries",
      title: "Laravel queue retries",
      excerpt: "e",
      image: "https://res.cloudinary.com/x.png",
      category: "",
      tags: ["Laravel"],
      readingTime: "4 min read",
      body: "b",
      faqs: [],
      reviewState: "approved" as const,
      reviewReasons: [],
      criticScore: 86,
      publishAt: new Date(NOW.getTime() + 20 * HOUR),
      contentCluster: "Laravel",
      targetKeyword: "queue retries",
      date: "2026-11-04",
    },
    social: social
      ? {
          body: "li",
          imageUrl: "",
          status: "scheduled" as const,
          reviewReasons: [],
          criticScore: 84,
          scheduledFor: new Date(NOW.getTime() + 30 * HOUR),
        }
      : null,
    log: { message: "intake", meta: { state: "scheduled" } },
    limits: { dayStart: new Date(NOW.getTime() - HOUR), maxPerDay: 1, minGapMs: 5 * HOUR, now: NOW, ...limits },
  });

  it("createIntake: lock, re-check key, slug and title, then insert blog, LinkedIn and three log rows", async () => {
    controlRows({ generator: jarvisGenerates });
    fake.handlers["blogPost.aggregate"] = () => ({ _max: { sortOrder: 41 } });
    fake.handlers["blogPost.create"] = () => ({ id: "b9" });
    fake.handlers["socialPost.create"] = () => ({ id: "li9" });
    const r = await store().createIntake(intakeData());
    assert.deepEqual(r, {
      ok: true,
      blogPostId: "b9",
      socialPostId: "li9",
      publishAt: new Date(NOW.getTime() + 20 * HOUR),
      scheduledFor: new Date(NOW.getTime() + 30 * HOUR),
    });
    assert.deepEqual(
      fake.raw().map((c) => c.args),
      [["jarvis:pipeline-generator"], ["jarvis:intake"]],
      "generator lock first, then the intake lock"
    );
    const reads = fake.of("generationLog", "findFirst").map((c) => (c.args as { where: { refType: string } }).where);
    assert.equal(reads[0].refType, "PipelineGenerator", "the generator is re-read under the lock");
    const keyRead = fake.of("generationLog", "findFirst")[1].args as { where: unknown };
    assert.deepEqual(keyRead.where, { stage: "jarvis", refType: "Intake", refId: "jv-content-01JBXK2M3N", status: "ok" });
    const dupRead = fake.of("blogPost", "findMany")[0].args as { where: unknown };
    assert.deepEqual(dupRead.where, {
      OR: [{ slug: "laravel-queue-retries" }, { title: { equals: "Laravel queue retries", mode: "insensitive" } }],
    });
    const blog = (fake.of("blogPost", "create")[0].args as { data: Record<string, unknown> }).data;
    assert.equal(blog.published, false);
    assert.equal(blog.origin, "pipeline");
    assert.equal(blog.reviewState, "approved");
    assert.equal(blog.sortOrder, 42);
    const li = (fake.of("socialPost", "create")[0].args as { data: Record<string, unknown> }).data;
    assert.equal(li.blogPostId, "b9");
    assert.equal(li.channel, "linkedin");
    const logs = fake.of("generationLog", "create").map((c) => (c.args as { data: Record<string, unknown> }).data);
    assert.deepEqual(logs.map((l) => [l.refType, l.refId]), [["BlogPost", "b9"], ["SocialPost", "li9"], ["Intake", "jv-content-01JBXK2M3N"]]);
    assert.equal(new Set(logs.map((l) => l.runId)).size, 1, "one run id for the intake");
    assert.equal((logs[2].meta as Record<string, unknown>).payloadHash, "hash1");
    assert.equal((logs[2].meta as Record<string, unknown>).source, "jarvis");
    assert.deepEqual(fake.txOptions[0], TX);
  });

  it("createIntake replays a key already recorded and writes nothing", async () => {
    controlRows({
      generator: jarvisGenerates,
      intake: { createdAt: NOW, meta: { payloadHash: "hash1", blogPostId: "b1", socialPostId: null, gates: { approveRequested: true } } },
    });
    const r = await store().createIntake(intakeData());
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.reason, "replay");
    assert.equal(fake.of("blogPost", "create").length, 0);
    assert.equal(fake.of("generationLog", "create").length, 0);
  });

  it("createIntake refuses a slug or title found under the lock", async () => {
    controlRows({ generator: jarvisGenerates });
    fake.handlers["blogPost.findMany"] = () => [{ id: "b1", slug: "laravel-queue-retries", title: "x" }];
    const r = await store().createIntake(intakeData(false));
    assert.deepEqual(r, { ok: false, reason: "duplicate", matches: [{ kind: "slug", id: "b1", slug: "laravel-queue-retries", title: "x" }] });
    assert.equal(fake.of("blogPost", "create").length, 0);
  });

  it("createIntake maps a unique slug violation to duplicate and a lock timeout to conflict", async () => {
    fake.txError = Object.assign(new Error("unique"), { code: "P2002" });
    const dup = await store().createIntake(intakeData());
    assert.equal(dup.ok === false && dup.reason, "duplicate");
    fake.txError = Object.assign(new Error("timeout"), { code: "P2028" });
    assert.deepEqual(await store().createIntake(intakeData()), { ok: false, reason: "conflict" });
    fake.txError = new Error("boom");
    await assert.rejects(store().createIntake(intakeData()), /boom/);
  });

  it("findIntake reads the newest ok Intake row for the key", async () => {
    fake.handlers["generationLog.findFirst"] = () => ({
      createdAt: NOW,
      meta: { payloadHash: "h", blogPostId: "b1", socialPostId: "li1", gates: null },
    });
    const r = await store().findIntake("jv-content-key1");
    assert.deepEqual(r, { key: "jv-content-key1", payloadHash: "h", blogPostId: "b1", socialPostId: "li1", gates: null, createdAt: NOW });
  });
});

/* ------------------------------------------------------------------ */
/* Review fixes: guarded cron insert, generator re-read, cap and gap   */
/* ------------------------------------------------------------------ */

describe("cron: the first write and the generator check share one locked transaction", () => {
  const SENT = "The queue worker retried the job after the database lock cleared, and the retry finished fast. ";
  const draft = {
    slug: "laravel-queue-retries",
    title: "Laravel queue retries after a lock timeout",
    excerpt: "How a queue retry recovered from a database lock without losing a job.",
    category: "Laravel",
    tags: ["Laravel"],
    readingTime: "4 min read",
    body: `## Why\n\n${SENT.repeat(30)}`,
    faqs: [],
    coverAlt: "cover",
    inlineImagePrompts: [],
    sources: [],
  };
  const brief = {
    id: "brief1",
    pillar: "Build/Laravel",
    topic: "Laravel queue retries",
    targetKeyword: "laravel queue retries",
    angle: "",
    realExample: "",
    requiresLiveSource: false,
    status: "queued",
    scheduledFor: null,
    usedAt: null,
    origin: "topic-bank",
    sourceUrl: "",
    formatHint: "",
    extraInstructions: "",
    createdAt: NOW,
  };
  const opts = { siteGeneratorOnly: true, generateImages: false, generateLinkedIn: false, generateX: false, notify: false };

  /** The generator row answers site for the first `siteReads` reads, then jarvis. */
  function generatorSequence(siteReads: number) {
    let reads = 0;
    fake.handlers["generationLog.findFirst"] = (args) => {
      const where = (args as { where: { refType?: string } }).where;
      if (where.refType !== "PipelineGenerator") return null;
      reads += 1;
      const generator = reads <= siteReads ? "site" : "jarvis";
      return { createdAt: NOW, meta: { action: "set_generator", generator } };
    };
    return () => reads;
  }

  let savedKey: string | undefined;
  beforeEach(() => {
    savedKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "test-key";
    // Every model call answers with the draft tool; the critic's parse fails and is logged, which is fine here.
    linkedInReply = () =>
      new Response(
        JSON.stringify({
          id: "msg1",
          type: "message",
          role: "assistant",
          model: "claude-sonnet-4-6",
          content: [{ type: "tool_use", id: "t1", name: "submit_blog_draft", input: draft }],
          stop_reason: "tool_use",
          stop_sequence: null,
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    fake.handlers["blogPost.upsert"] = () => ({ id: "b1" });
    fake.handlers["blogPost.aggregate"] = () => ({ _max: { sortOrder: 3 } });
  });
  const restore = () => {
    if (savedKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = savedKey;
  };

  const quietly = async <T>(fn: () => Promise<T>) => {
    const saved = [console.error, console.warn];
    console.error = () => undefined;
    console.warn = () => undefined;
    try {
      return await fn();
    } finally {
      [console.error, console.warn] = saved;
      restore();
    }
  };

  it("site at the early check, jarvis under the lock: nothing is written, the brief stays queued", async () => {
    const reads = generatorSequence(1);
    const r = await quietly(() => m.generate.runGenerateFromBrief(brief as never, opts));
    assert.equal(r.status, "skip", r.message);
    assert.equal(r.message, "Generation handed to Jarvis");
    assert.equal(reads(), 2);
    assert.equal(fake.of("blogPost", "upsert").length, 0, "no post written");
    assert.equal(fake.of("brief", "update").length, 0, "brief not marked used");
    const lock = fake.raw().find((c) => /pg_advisory_xact_lock_shared/.test(c.op));
    assert.ok(lock, "the insert transaction took the shared generator lock");
    assert.deepEqual(lock?.args, ["jarvis:pipeline-generator"]);
  });

  it("site until the insert, jarvis before approval: the post is written but held in needs_review", async () => {
    const reads = generatorSequence(2);
    const r = await quietly(() => m.generate.runGenerateFromBrief(brief as never, opts));
    assert.equal(r.status, "ok", r.message);
    assert.equal(r.message, "Generated, needs review");
    assert.equal(reads(), 3);
    // The second write goes through upsertBlogPost again (update by id, or upsert by slug).
    const writes = [
      ...fake.of("blogPost", "update").map((c) => (c.args as { data: Record<string, unknown> }).data),
      ...fake.of("blogPost", "upsert").slice(1).map((c) => (c.args as { create: Record<string, unknown> }).create),
    ];
    assert.equal(writes.length, 1);
    const last = writes[0];
    assert.equal(last.reviewState, "needs_review");
    assert.equal(last.published, false);
    assert.equal(last.publishAt, null);
    assert.ok((last.reviewReasons as string[]).includes(m.generate.GENERATOR_MOVED_REASON));
    const first = (fake.of("blogPost", "upsert")[0].args as { create: Record<string, unknown> }).create;
    assert.equal(first.sortOrder, 4, "sort order read inside the transaction");
  });

  it("jarvis at the early check: stops before any image or write", async () => {
    generatorSequence(0);
    const r = await quietly(() =>
      m.generate.runGenerateFromBrief(brief as never, { ...opts, generateImages: true })
    );
    assert.equal(r.status, "skip");
    assert.equal(fake.of("blogPost", "upsert").length, 0);
    const msgs = fake.of("generationLog", "create").map((c) => (c.args as { data: { message: string } }).data.message);
    assert.ok(msgs.some((x) => /before images and writing/.test(x)));
    assert.ok(!msgs.some((x) => /^Cover via|Inline images/.test(x)), "no image stage ran");
  });

  it("writeIfSiteGenerates: unreadable fails closed, an error from the write is rethrown", async () => {
    const originalError = console.error;
    console.error = () => undefined;
    try {
      controlRows({ generatorError: true });
      assert.deepEqual(await m.generator.writeIfSiteGenerates(async () => 1, fake as never), { ok: false, reason: "unreadable" });
      controlRows({});
      assert.deepEqual(await m.generator.writeIfSiteGenerates(async () => 1, fake as never), { ok: true, value: 1 });
      await assert.rejects(
        m.generator.writeIfSiteGenerates(async () => {
          throw new Error("unique slug");
        }, fake as never),
        /unique slug/
      );
    } finally {
      console.error = originalError;
    }
  });

  it("setGenerator holds the generator lock exclusively", async () => {
    controlRows({});
    await store().setGenerator({
      expect: "site",
      log: { refType: "PipelineGenerator", refId: "generator", status: "ok", message: "m", meta: { generator: "jarvis" } },
    });
    assert.equal(fake.raw().length, 1);
    assert.match(fake.raw()[0].op, /pg_advisory_xact_lock\(hashtext/);
    assert.doesNotMatch(fake.raw()[0].op, /shared/);
  });
});

describe("prisma store: createIntake re-checks the generator, the daily cap and the gap under its locks", () => {
  const base = (over: Record<string, unknown> = {}) =>
    ({
      key: "jv-content-01JBXK2M3N",
      payloadHash: "h",
      blog: {
        slug: "s",
        title: "t",
        excerpt: "e",
        image: "",
        category: "",
        tags: [],
        readingTime: "1 min read",
        body: "b",
        faqs: [],
        reviewState: "approved",
        reviewReasons: [],
        criticScore: 90,
        publishAt: new Date(NOW.getTime() + 20 * HOUR),
        contentCluster: "",
        targetKeyword: "",
        date: "2026-11-04",
      },
      social: { body: "li", imageUrl: "", status: "scheduled", reviewReasons: [], criticScore: 90, scheduledFor: new Date(NOW.getTime() + 22 * HOUR) },
      log: { message: "m", meta: {} },
      limits: { dayStart: new Date(NOW.getTime() - HOUR), maxPerDay: 2, minGapMs: 5 * HOUR, now: NOW },
      ...over,
    }) as never;

  beforeEach(() => {
    fake.handlers["blogPost.aggregate"] = () => ({ _max: { sortOrder: 1 } });
  });

  it("refuses when the generator under the lock is site", async () => {
    controlRows({});
    assert.deepEqual(await store().createIntake(base()), { ok: false, reason: "generator", generator: "site" });
    assert.equal(fake.of("blogPost", "create").length, 0);
  });

  it("refuses at the daily cap, counting today's accepted intakes", async () => {
    controlRows({ generator: jarvisGenerates });
    fake.handlers["generationLog.count"] = () => 2;
    assert.deepEqual(await store().createIntake(base()), { ok: false, reason: "daily_cap", accepted: 2 });
    const where = (fake.of("generationLog", "count")[0].args as { where: Record<string, unknown> }).where;
    assert.deepEqual(where, { stage: "jarvis", refType: "Intake", status: "ok", createdAt: { gte: new Date(NOW.getTime() - HOUR) } });
    assert.equal(fake.of("blogPost", "create").length, 0);
  });

  it("an explicit time inside the gap is refused; a next-slot time is redrawn after the latest scheduled blog", async () => {
    controlRows({ generator: jarvisGenerates });
    const near = new Date(NOW.getTime() + 21 * HOUR);
    const latest = new Date(NOW.getTime() + 40 * HOUR);
    fake.handlers["blogPost.findFirst"] = (args) =>
      (args as { orderBy?: unknown }).orderBy ? { publishAt: latest } : { publishAt: near };
    assert.deepEqual(await store().createIntake(base()), { ok: false, reason: "gap", near });

    fake.calls = [];
    fake.handlers["blogPost.create"] = () => ({ id: "b9" });
    fake.handlers["socialPost.create"] = () => ({ id: "li9" });
    const seen: Array<Date | null> = [];
    const to = new Date(NOW.getTime() + 46 * HOUR);
    const liTo = new Date(NOW.getTime() + 50 * HOUR);
    const redraw = (l: Date | null) => {
      seen.push(l);
      return { publishAt: to, scheduledFor: liTo };
    };
    const r = await store().createIntake(base({ limits: { dayStart: NOW, maxPerDay: 2, minGapMs: 5 * HOUR, now: NOW, redraw } }));
    assert.equal(r.ok, true);
    assert.deepEqual(seen, [latest]);
    assert.equal((fake.of("blogPost", "create")[0].args as { data: { publishAt: Date } }).data.publishAt, to);
    assert.equal((fake.of("socialPost", "create")[0].args as { data: { scheduledFor: Date } }).data.scheduledFor, liTo);
    const gapWhere = (fake.of("blogPost", "findFirst")[0].args as { where: { publishAt: unknown } }).where.publishAt;
    assert.deepEqual(gapWhere, { gt: new Date(NOW.getTime() + 15 * HOUR), lt: new Date(NOW.getTime() + 25 * HOUR) });
  });

  it("a needs_review blog skips the gap check", async () => {
    controlRows({ generator: jarvisGenerates });
    fake.handlers["blogPost.create"] = () => ({ id: "b9" });
    fake.handlers["blogPost.findFirst"] = () => ({ publishAt: new Date(NOW.getTime() + 20 * HOUR) });
    const r = await store().createIntake(base({ social: null, blog: { ...(base() as { blog: object }).blog, reviewState: "needs_review" } }));
    assert.equal(r.ok, true);
  });
});
