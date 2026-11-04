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
  }
}

const fake = new FakePrisma();
const NOW = new Date();
const HOUR = 3600_000;

type Mods = {
  store: typeof import("@/lib/jarvis/prisma-store");
  pause: typeof import("@/lib/jarvis/pause");
  publishDue: typeof import("@/lib/pipeline/run-publish-due");
  publishLi: typeof import("@/lib/pipeline/run-publish-linkedin");
  generate: typeof import("@/lib/pipeline/run-generate");
  tick: typeof import("@/app/api/cron/tick/route");
};
let m: Mods;

const log = { refType: "BlogPost" as const, refId: "b1", status: "ok" as const, message: "m", meta: { source: "jarvis" } };

before(async () => {
  process.env.DATABASE_URL = "postgresql://fake:fake@127.0.0.1:1/fake";
  process.env.CRON_SECRET = "cron-secret-for-tests";
  (globalThis as unknown as { prisma: unknown }).prisma = fake;
  m = {
    store: await import("@/lib/jarvis/prisma-store"),
    pause: await import("@/lib/jarvis/pause"),
    publishDue: await import("@/lib/pipeline/run-publish-due"),
    publishLi: await import("@/lib/pipeline/run-publish-linkedin"),
    generate: await import("@/lib/pipeline/run-generate"),
    tick: await import("@/app/api/cron/tick/route"),
  };
});

beforeEach(() => fake.reset());

const store = () => m.store.createPrismaControlStore(() => fake as never);

describe("prisma store: guarded writes", () => {
  it("updateBlog to scheduled guards on updatedAt and no earlier LinkedIn post, at Serializable", async () => {
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
      socialPosts: { none: { status: "scheduled", scheduledFor: { lt: at } } },
    });
    assert.deepEqual(fake.txOptions[0], { isolationLevel: "Serializable" });
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
    assert.deepEqual(where.socialPosts, { none: { status: "scheduled" } });
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

  it("a serialization failure reports false; other errors throw", async () => {
    fake.txError = Object.assign(new Error("could not serialize"), { code: "P2034" });
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

  it("updateSocial to scheduled guards on its blog being live by that time", async () => {
    fake.handlers["socialPost.updateMany"] = () => ({ count: 1 });
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
    assert.deepEqual(fake.txOptions[0], { isolationLevel: "Serializable" });
  });

  it("createBrief re-checks the topic inside the transaction", async () => {
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
    assert.equal(fake.of("brief", "create").length, 0);
    assert.deepEqual(fake.txOptions[0], { isolationLevel: "Serializable" });
  });

  it("setPipelineControl refuses when the switch moved, else moves rows still at their old time", async () => {
    fake.handlers["generationLog.findFirst"] = () => ({ createdAt: NOW, meta: { action: "resume" } });
    const pipelineLog = { refType: "Pipeline" as const, refId: "pipeline", status: "ok" as const, message: "m", meta: { action: "resume" } };
    const from = new Date(NOW.getTime() - HOUR);
    const to = new Date(NOW.getTime() + 20 * HOUR);
    const reschedule = { blogs: [{ id: "b1", from, to }], social: [{ id: "li1", from, to }] };

    const refused = await store().setPipelineControl({ expectPaused: true, log: pipelineLog, reschedule });
    assert.equal(refused.ok, false);
    assert.equal(fake.of("blogPost", "updateMany").length, 0);
    assert.equal(fake.of("generationLog", "create").length, 0);

    fake.reset();
    fake.handlers["generationLog.findFirst"] = () => ({ createdAt: NOW, meta: { action: "pause" } });
    fake.handlers["blogPost.updateMany"] = () => ({ count: 1 });
    fake.handlers["socialPost.updateMany"] = () => ({ count: 0 });
    const done = await store().setPipelineControl({ expectPaused: true, log: pipelineLog, reschedule });
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
