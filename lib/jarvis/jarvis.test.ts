import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { MIN_TOKEN_LENGTH, authorize, bearerToken, configuredToken } from "@/lib/jarvis/auth";
import { makeHandlers, RATE_LIMIT, type JarvisHandlers } from "@/lib/jarvis/handlers";
import { isPipelinePaused, pauseSource, type PipelineControl } from "@/lib/jarvis/pause";
import {
  generatorSource,
  siteMayGenerate,
  type Generator,
  type GeneratorControl,
} from "@/lib/jarvis/generator";
import { MAX_LINK_CHECKS } from "@/lib/jarvis/intake";
import { intakeBody as intakeSchema, isPublicHost } from "@/lib/jarvis/schemas";
import { intakePayloadHash } from "@/lib/jarvis/intake";
import { SlidingWindowLimiter } from "@/lib/jarvis/rate-limit";
import { createControlService } from "@/lib/jarvis/service";
import { PAUSE_MARKER, blogStateOf, socialStateOf, transitionFor } from "@/lib/jarvis/states";
import type {
  BlogDetail,
  BriefRow,
  ControlLog,
  ControlStore,
  CreateIntakeResult,
  DayPlanRow,
  IntakeMatch,
  IntakeRecord,
  LogRow,
  NewIntake,
  PastDue,
  Reschedule,
  SocialDetail,
  SocialGuard,
  BlogGuard,
} from "@/lib/jarvis/store";
import type { DuplicateCheckResult } from "@/lib/pipeline/manual/duplicate-check";

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

const TOKEN = "t".repeat(MIN_TOKEN_LENGTH + 8);
const NOW = new Date("2026-11-04T10:00:00.000Z");
const HOUR = 3600_000;
/** Test draws: a blog goes 20h after `from`, a LinkedIn post 30h after `after`. */
const drawBlog = (from: Date) => new Date(from.getTime() + 20 * HOUR);
const drawLi = (after: Date) => new Date(after.getTime() + 30 * HOUR);
const DRAWN_BLOG_AT = drawBlog(NOW);
const DRAWN_LI_AT = drawLi(NOW);
const EM_DASH = String.fromCodePoint(0x2014);

const SENTENCE =
  "The queue worker retried the job after the database lock cleared, and the retry finished in under a second. ";
const GOOD_BODY = `## Why the retry mattered\n\n${SENTENCE.repeat(24)}\n\n## What we changed\n\n${SENTENCE.repeat(12)}`;

function blog(over: Partial<BlogDetail> = {}): BlogDetail {
  return {
    id: "blog1",
    slug: "laravel-queue-retries",
    title: "Laravel queue retries after a lock timeout",
    excerpt: "How a queue retry recovered from a database lock.",
    origin: "pipeline",
    published: false,
    reviewState: "needs_review",
    reviewReasons: ["critic: tighten the intro"],
    criticScore: 82,
    publishAt: null,
    briefId: "brief1",
    createdAt: new Date(NOW.getTime() - 2 * HOUR),
    updatedAt: new Date(NOW.getTime() - HOUR),
    social: [],
    body: GOOD_BODY,
    image: "https://res.cloudinary.com/twixr/image/upload/cover.png",
    tags: ["Laravel", "Queues"],
    faqs: [],
    brief: { requiresLiveSource: false },
    ...over,
  };
}

function social(over: Partial<SocialDetail> = {}): SocialDetail {
  return {
    id: "li1",
    channel: "linkedin",
    status: "needs_review",
    reviewReasons: [],
    criticScore: 80,
    scheduledFor: new Date(NOW.getTime() - HOUR),
    publishedAt: null,
    body: `A queue retry saved a release this week. ${SENTENCE.repeat(3)}\n\n#Laravel #Queues`,
    blogPostId: "blog1",
    failReason: "",
    createdAt: new Date(NOW.getTime() - 2 * HOUR),
    blog: { published: true, reviewState: "approved", publishAt: new Date(NOW.getTime() - 5 * HOUR) },
    ...over,
  };
}

const COVER = "https://res.cloudinary.com/twixr/image/upload/cover.png";
const LI_BODY = `A queue retry saved a release this week. ${SENTENCE.repeat(3)}\n\n#Laravel #Queues`;

/** A finished blog that passes every site gate. */
function intakeBody(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    idempotencyKey: "jv-content-01JBXK2M3N",
    title: "Laravel queue retries after a lock timeout",
    excerpt: "How a queue retry recovered from a database lock without losing a single job.",
    slug: "laravel-queue-retries-lock-timeout",
    tags: ["Laravel", "Queues"],
    body: GOOD_BODY,
    criticScore: 86,
    coverImageUrl: COVER,
    topic: "Laravel queue retries",
    pillar: "Build/Laravel",
    ...over,
  };
}

type Logged = ControlLog & { id: string; createdAt: Date };

class FakeStore implements ControlStore {
  blogs = new Map<string, BlogDetail>();
  socials = new Map<string, SocialDetail>();
  briefs: Array<BriefRow & { extraInstructions: string }> = [];
  logs: Logged[] = [];
  control: PipelineControl | null = null;
  plan: DayPlanRow | null = null;
  dup: DuplicateCheckResult = { blocked: false, risk: 0, reason: "No strong duplicate", matches: [] };
  allowlist = new Set<string>();
  /** Simulate the cron touching the row between read and write. */
  raceNextUpdate = false;
  /** Runs inside the write before its checks: another writer that committed first. */
  beforeWrite: (() => void) | null = null;
  /** Simulate a parallel insert the pre-check did not see. */
  hiddenQueuedTopic: string | null = null;
  /** Simulate the pipeline switch flipping between read and write. */
  racePipeline = false;
  due: PastDue = { blogs: [], social: [], lastScheduledBlogAt: null, held: [], more: false };
  generator: GeneratorControl | null = null;
  /** Simulate the generator switch flipping between read and write. */
  raceGenerator = false;
  intakes = new Map<string, IntakeRecord>();
  /** A same-key intake that committed between the pre-check and the write. */
  hiddenIntake: IntakeRecord | null = null;
  /** A slug a CMS post took between the pre-check and the write. */
  hiddenSlug: string | null = null;
  latestScheduled: Date | null = null;
  /** Pipeline blogs with today's date written by the site's own cron (not in the blogs map). */
  pipelineBlogsToday = 0;
  /** Simulate the switch moving back to site between the pre-check and the locked write. */
  generatorFlipsInWrite = false;
  /** A twin submit of the same key that commits right after the first key lookup. */
  pendingIntake: IntakeRecord | null = null;
  /** A twin that committed under the lock just before this write, reported by the write as a duplicate. */
  twinOnWrite: IntakeRecord | null = null;
  /** Run during the link check: lets a test move the clock. */
  duringLinkCheck: (() => void) | null = null;
  /** URLs the fake dead-link check reports dead; every call is recorded. */
  deadUrls = new Set<string>();
  linkChecks: string[][] = [];

  private record(log: ControlLog) {
    this.logs.push({ ...log, id: `log${this.logs.length + 1}`, createdAt: NOW });
    if (log.refType === "Pipeline" && log.status === "ok") {
      this.control = { paused: log.meta.action === "pause", at: NOW, reason: String(log.meta.reason ?? "") };
    }
    if (log.refType === "PipelineGenerator" && log.status === "ok") {
      this.generator = { generator: log.meta.generator as Generator, at: NOW, reason: String(log.meta.reason ?? "") };
    }
  }

  async pipelineControl() {
    return this.control;
  }
  async generatorControl() {
    return this.generator;
  }
  async setGenerator(input: { expect: Generator; log: ControlLog }) {
    if (this.raceGenerator || (this.generator?.generator ?? "site") !== input.expect) return { ok: false };
    this.record(input.log);
    return { ok: true };
  }
  async findIntake(key: string) {
    const found = this.intakes.get(key) ?? null;
    if (this.pendingIntake) {
      this.intakes.set(this.pendingIntake.key, this.pendingIntake);
      this.pendingIntake = null;
    }
    return found;
  }
  async findBlogMatches({ slug, title }: { slug: string; title: string }): Promise<IntakeMatch[]> {
    return [...this.blogs.values()]
      .filter((b) => b.slug === slug || b.title.trim().toLowerCase() === title.trim().toLowerCase())
      .map((b) => ({ kind: b.slug === slug ? ("slug" as const) : ("title" as const), id: b.id, slug: b.slug, title: b.title }));
  }
  async latestScheduledBlogAt() {
    return this.latestScheduled;
  }
  async createIntake(data: NewIntake): Promise<CreateIntakeResult> {
    if (this.hiddenIntake) {
      this.intakes.set(this.hiddenIntake.key, this.hiddenIntake);
      this.hiddenIntake = null;
    }
    if (this.generatorFlipsInWrite) this.generator = { generator: "site", at: NOW, reason: "" };
    const generator = this.generator?.generator ?? "site";
    if (generator !== "jarvis") return { ok: false, reason: "generator", generator };
    const prior = this.intakes.get(data.key);
    if (prior) return { ok: false, reason: "replay", record: prior };
    if (this.twinOnWrite) {
      this.intakes.set(this.twinOnWrite.key, this.twinOnWrite);
      this.twinOnWrite = null;
      return { ok: false, reason: "duplicate", matches: [{ kind: "slug", id: "twin-blog", slug: data.blog.slug, title: data.blog.title }] };
    }
    if (this.hiddenSlug === data.blog.slug) {
      return { ok: false, reason: "duplicate", matches: [{ kind: "slug", id: "cms1", slug: data.blog.slug, title: "CMS post" }] };
    }
    const matches = await this.findBlogMatches(data.blog);
    if (matches.length) return { ok: false, reason: "duplicate", matches };
    const accepted =
      this.pipelineBlogsToday +
      [...this.blogs.values()].filter((b) => b.origin === "pipeline" && b.id.startsWith("intake-blog")).length;
    if (accepted >= data.limits.maxPerDay) return { ok: false, reason: "daily_cap", accepted };
    let publishAt = data.blog.publishAt;
    let scheduledFor = data.social?.scheduledFor ?? null;
    if (data.blog.reviewState === "approved" && publishAt) {
      const at = publishAt.getTime();
      const scheduled = [...this.blogs.values()].filter((b) => !b.published && b.reviewState === "approved" && b.publishAt);
      const near = scheduled.find((b) => Math.abs((b.publishAt as Date).getTime() - at) < data.limits.minGapMs);
      if (near) {
        if (!data.limits.redraw) return { ok: false, reason: "gap", near: near.publishAt as Date };
        const latest = scheduled.reduce<Date | null>(
          (acc, b) => (!acc || (b.publishAt as Date) > acc ? (b.publishAt as Date) : acc),
          null
        );
        const redrawn = data.limits.redraw(latest);
        publishAt = redrawn.publishAt;
        scheduledFor = data.social ? redrawn.scheduledFor : null;
      }
    }
    const id = `intake-blog${this.blogs.size + 1}`;
    const { date: _date, image, ...rest } = data.blog;
    void _date;
    this.blogs.set(id, {
      ...blog(),
      ...rest,
      publishAt,
      id,
      image,
      origin: "pipeline",
      published: false,
      briefId: null,
      brief: null,
      social: [],
      createdAt: NOW,
      updatedAt: NOW,
    });
    let socialId: string | null = null;
    if (data.social) {
      socialId = `intake-li${this.socials.size + 1}`;
      this.socials.set(socialId, {
        ...social(),
        ...data.social,
        scheduledFor: scheduledFor ?? data.social.scheduledFor,
        id: socialId,
        blogPostId: id,
        blog: { published: false, reviewState: data.blog.reviewState, publishAt: data.blog.publishAt },
      });
    }
    const meta = { ...data.log.meta, source: "jarvis", action: "intake", key: data.key, blogPostId: id, socialPostId: socialId };
    this.record({ refType: "BlogPost", refId: id, status: "ok", message: data.log.message, meta });
    if (socialId) this.record({ refType: "SocialPost", refId: socialId, status: "ok", message: "li", meta });
    this.record({ refType: "Intake", refId: data.key, status: "ok", message: data.log.message, meta: { ...meta, payloadHash: data.payloadHash } });
    this.intakes.set(data.key, {
      key: data.key,
      payloadHash: data.payloadHash,
      blogPostId: id,
      socialPostId: socialId,
      gates: data.log.meta.gates,
      createdAt: NOW,
    });
    return {
      ok: true,
      blogPostId: id,
      socialPostId: socialId,
      publishAt,
      scheduledFor: socialId ? scheduledFor ?? data.social?.scheduledFor ?? null : null,
    };
  }
  async recentRuns() {
    return [
      { runId: "run1", startedAt: NOW, endedAt: NOW, status: "ok" as const, stages: ["publish"], lastMessage: "Published 1 blog(s)" },
    ];
  }
  async dayPlan() {
    return this.plan;
  }
  async nextBlogPublishAt() {
    return DRAWN_BLOG_AT;
  }
  async nextLinkedInAt() {
    return null;
  }
  async queuedBriefCount() {
    return this.briefs.filter((b) => b.status === "queued").length;
  }
  async listBriefs({ limit }: { limit: number }) {
    return { items: this.briefs.slice(0, limit), nextCursor: this.briefs.length > limit ? this.briefs[limit - 1].id : null };
  }
  async listBlogs({ limit, state }: { limit: number; state?: string }) {
    const all = [...this.blogs.values()].filter((b) => !state || blogStateOf(b) === state);
    return { items: all.slice(0, limit), nextCursor: null };
  }
  async listSocial({ limit }: { limit: number }) {
    return { items: [...this.socials.values()].slice(0, limit), nextCursor: null };
  }
  async listLogs({ limit, refId }: { limit: number; refId?: string }): Promise<{ items: LogRow[]; nextCursor: string | null }> {
    const rows = this.logs
      .filter((l) => !refId || l.refId === refId)
      .map((l) => ({ ...l, runId: "r", stage: "jarvis" }));
    return { items: rows.slice(0, limit), nextCursor: rows.length > limit ? rows[limit - 1].id : null };
  }
  async getBlog(id: string) {
    const b = this.blogs.get(id);
    return b ? { ...b, social: b.social.map((s) => ({ ...s })) } : null;
  }
  async getSocial(id: string) {
    const s = this.socials.get(id);
    return s ? { ...s } : null;
  }
  async findQueuedBriefByTopic(topic: string) {
    const hit = this.briefs.find((b) => b.status === "queued" && b.topic.toLowerCase() === topic.toLowerCase());
    return hit ? { id: hit.id } : null;
  }
  async duplicateCheck() {
    return this.dup;
  }
  async internalAllowlist() {
    return this.allowlist;
  }
  async createBrief(data: Parameters<ControlStore["createBrief"]>[0], log: Omit<ControlLog, "refId">) {
    if (this.hiddenQueuedTopic?.toLowerCase() === data.topic.toLowerCase()) {
      return { ok: false as const, reason: "duplicate" as const, id: "brief-parallel" };
    }
    const row = {
      id: `brief${this.briefs.length + 10}`,
      ...data,
      status: "queued",
      usedAt: null,
      origin: "jarvis",
      createdAt: NOW,
    };
    this.briefs.push(row);
    this.record({ ...log, refId: row.id });
    return { ok: true as const, brief: row };
  }
  async pastDue() {
    return this.due;
  }
  async setPipelineControl(input: { expectPaused: boolean; flip: boolean; log: ControlLog; reschedule: Reschedule }) {
    if (this.racePipeline || (this.control?.paused ?? false) !== input.expectPaused) {
      return { ok: false, applied: { blogs: [], social: [] } };
    }
    // Same rule as the transaction: a blog moves only if none of its live posts stays before it.
    for (const b of input.reschedule.blogs) {
      const after = new Map(input.reschedule.social.filter((m) => m.blogId === b.id).map((m) => [m.id, m.to]));
      const early = [...this.socials.values()].filter(
        (p) => p.blogPostId === b.id && ["scheduled", "publishing"].includes(p.status) && (after.get(p.id) ?? p.scheduledFor) < b.to
      );
      if (early.length) throw new Error(`blog ${b.id} would move after its LinkedIn post(s) ${early.map((p) => p.id)}`);
    }
    for (const m of input.reschedule.blogs) {
      const b = this.blogs.get(m.id);
      if (b) this.blogs.set(m.id, { ...b, publishAt: m.to });
    }
    for (const m of input.reschedule.social) {
      const p = this.socials.get(m.id);
      if (p) this.socials.set(m.id, { ...p, scheduledFor: m.to });
    }
    if (input.flip) this.record(input.log);
    else this.logs.push({ ...input.log, refType: "PipelineBacklog", id: `log${this.logs.length + 1}`, createdAt: NOW });
    return { ok: true, applied: input.reschedule };
  }
  /** Guards evaluated against the store's current rows, as the transaction does. */
  async updateBlog(id: string, guard: BlogGuard, data: Parameters<ControlStore["updateBlog"]>[2], log: ControlLog) {
    this.beforeWrite?.();
    const b = this.blogs.get(id);
    if (this.raceNextUpdate || !b || b.published || b.updatedAt.getTime() !== guard.updatedAt.getTime()) return false;
    if (guard.expect && (blogStateOf(b) !== guard.expect.state || b.updatedAt.getTime() !== guard.expect.updatedAt.getTime())) {
      return false;
    }
    const live = [...this.socials.values()].filter(
      (p) => p.blogPostId === id && (p.status === "scheduled" || p.status === "publishing")
    );
    const blocked =
      "noneScheduled" in guard.social
        ? live.length > 0
        : live.some((p) => p.scheduledFor.getTime() < (guard.social as { noneScheduledBefore: Date }).noneScheduledBefore.getTime());
    if (blocked) return false;
    this.blogs.set(id, { ...b, ...data, updatedAt: new Date(b.updatedAt.getTime() + 1) });
    this.record(log);
    return true;
  }
  async updateSocial(id: string, guard: SocialGuard, data: Parameters<ControlStore["updateSocial"]>[2], log: ControlLog) {
    this.beforeWrite?.();
    const s = this.socials.get(id);
    if (!s || s.status !== guard.status || s.scheduledFor.getTime() !== guard.scheduledFor.getTime()) return false;
    if (guard.expect && (socialStateOf(s) !== guard.expect.state || s.scheduledFor.getTime() !== guard.expect.scheduledFor.getTime())) {
      return false;
    }
    if (guard.blogLiveBy && s.blogPostId) {
      const b = this.blogs.get(s.blogPostId);
      if (b && !b.published && !(b.reviewState === "approved" && b.publishAt && b.publishAt <= guard.blogLiveBy)) {
        return false;
      }
    }
    this.socials.set(id, { ...s, ...data });
    this.record(log);
    return true;
  }
  async writeLog(log: ControlLog) {
    this.record(log);
  }
}

/* ------------------------------------------------------------------ */
/* Harness                                                             */
/* ------------------------------------------------------------------ */

let store: FakeStore;
let clockNow = NOW;
let token: string | null;
let handlers: JarvisHandlers;

function build(limiter = new SlidingWindowLimiter(1000, 60_000)) {
  handlers = makeHandlers({
    token: () => token,
    limiter,
    nowMs: () => NOW.getTime(),
    service: () =>
      createControlService({
        store,
        now: () => clockNow,
        config: {
          enabled: true,
          autoPublish: true,
          criticFloor: 60,
          criticMinScore: 78,
          minGapHours: 5,
          maxPerDay: 5,
          timezone: "Asia/Karachi",
          crons: [{ path: "/api/cron/tick", schedule: "*/10 * * * *" }],
        },
        dayKey: () => "2026-11-04",
        drawBlogPublishAt: drawBlog,
        drawLinkedInAt: drawLi,
        checkLinks: async (urls) => {
          store.linkChecks.push(urls);
          store.duringLinkCheck?.();
          return urls.filter((u) => store.deadUrls.has(u)).map((u) => `Dead or unreachable link: ${u}`);
        },
      }),
  });
}

beforeEach(() => {
  clockNow = NOW;
  store = new FakeStore();
  token = TOKEN;
  build();
});

function req(
  path: string,
  init: { method?: string; body?: unknown; auth?: string | null; ip?: string; headers?: Record<string, string> } = {}
) {
  const headers = new Headers({ "x-forwarded-for": init.ip ?? "203.0.113.7", ...init.headers });
  const auth = init.auth === undefined ? `Bearer ${TOKEN}` : init.auth;
  if (auth) headers.set("authorization", auth);
  let body: string | undefined;
  if (init.body !== undefined) {
    body = typeof init.body === "string" ? init.body : JSON.stringify(init.body);
    headers.set("content-type", "application/json");
  }
  return new Request(`https://twixrsolutions.com/api/jarvis/${path}`, {
    method: init.method ?? (body ? "POST" : "GET"),
    headers,
    body,
  });
}

async function call(res: Promise<Response>) {
  const r = await res;
  // Response bodies are free-form JSON; the assertions below check their shape.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: r.status, headers: r.headers, json: (await r.json()) as Record<string, any> };
}

const act = (kind: string, id: string, body: unknown, auth?: string | null) =>
  call(handlers.actOnDraft(req(`drafts/${kind}/${id}`, { body, auth }), { kind, id }));

/** Every route, as Jarvis would call it. */
function everyRoute(auth?: string | null) {
  return [
    handlers.status(req("status", { auth })),
    handlers.listBriefs(req("briefs", { auth })),
    handlers.createBrief(req("briefs", { auth, body: { topic: "Laravel queue retries" } })),
    handlers.listDrafts(req("drafts", { auth })),
    handlers.getDraft(req("drafts/blog/blog1", { auth }), { kind: "blog", id: "blog1" }),
    handlers.actOnDraft(req("drafts/blog/blog1", { auth, body: { action: "approve" } }), { kind: "blog", id: "blog1" }),
    handlers.actOnPipeline(req("pipeline", { auth, body: { action: "pause" } })),
    handlers.actOnPipeline(req("pipeline", { auth, body: { action: "set_generator", generator: "jarvis" } })),
    handlers.submitIntake(req("intake", { auth, body: intakeBody() })),
    handlers.listLogs(req("logs", { auth })),
  ];
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

describe("auth", () => {
  it("treats a missing or short JARVIS_CONTROL_TOKEN as disabled", () => {
    assert.equal(configuredToken({}), null);
    assert.equal(configuredToken({ JARVIS_CONTROL_TOKEN: "   " }), null);
    assert.equal(configuredToken({ JARVIS_CONTROL_TOKEN: "short" }), null);
    assert.equal(configuredToken({ JARVIS_CONTROL_TOKEN: ` ${TOKEN} ` }), TOKEN);
  });

  it("parses only a well formed bearer header", () => {
    assert.equal(bearerToken(`Bearer ${TOKEN}`), TOKEN);
    assert.equal(bearerToken(`bearer ${TOKEN}`), TOKEN);
    assert.equal(bearerToken(TOKEN), null);
    assert.equal(bearerToken("Basic abc"), null);
    assert.equal(bearerToken(null), null);
  });

  it("authorize: disabled, wrong, missing and right", () => {
    assert.deepEqual(authorize(`Bearer ${TOKEN}`, null), { ok: false, status: 503, code: "disabled" });
    assert.equal(authorize(`Bearer ${TOKEN}x`, TOKEN).ok, false);
    assert.equal(authorize(null, TOKEN).ok, false);
    assert.equal(authorize(`Bearer ${TOKEN}`, TOKEN).ok, true);
  });

  it("every route returns 503 when the env token is missing, even with a token", async () => {
    token = null;
    for (const res of everyRoute()) {
      const r = await call(res);
      assert.equal(r.status, 503);
      assert.equal(r.json.error.code, "disabled");
    }
    assert.equal(store.logs.length, 0);
  });

  it("every route returns 401 for a wrong or missing token and changes nothing", async () => {
    store.blogs.set("blog1", blog());
    for (const auth of [`Bearer ${"x".repeat(40)}`, null, "Basic Zm9vOmJhcg=="]) {
      for (const res of everyRoute(auth)) {
        const r = await call(res);
        assert.equal(r.status, 401);
        assert.equal(r.json.error.code, "unauthorized");
        assert.match(r.headers.get("www-authenticate") ?? "", /Bearer/);
        assert.ok(!JSON.stringify(r.json).includes("x".repeat(40)), "token never echoed");
      }
    }
    assert.equal(store.logs.length, 0);
    assert.equal(store.briefs.length, 0);
    assert.equal(store.intakes.size, 0);
    assert.equal(store.generator, null);
    assert.equal(store.blogs.get("blog1")?.reviewState, "needs_review");
  });

  it("the right token passes and every response is no-store", async () => {
    const r = await call(handlers.status(req("status")));
    assert.equal(r.status, 200);
    assert.match(r.headers.get("cache-control") ?? "", /no-store/);
    const e = await call(handlers.status(req("status", { auth: null })));
    assert.match(e.headers.get("cache-control") ?? "", /no-store/);
  });

  it("rate limits per IP with Retry-After", async () => {
    build(new SlidingWindowLimiter(2, RATE_LIMIT.windowMs));
    assert.equal((await handlers.status(req("status"))).status, 200);
    assert.equal((await handlers.status(req("status"))).status, 200);
    const limited = await call(handlers.status(req("status")));
    assert.equal(limited.status, 429);
    assert.equal(limited.json.error.code, "rate_limited");
    assert.ok(Number(limited.headers.get("retry-after")) >= 1);
    assert.equal((await handlers.status(req("status", { ip: "198.51.100.2" }))).status, 200);
  });
});

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

describe("validation", () => {
  const bad: Array<[string, unknown, string]> = [
    ["missing topic", {}, "topic"],
    ["short topic", { topic: "ab" }, "topic"],
    ["unknown key", { topic: "Laravel queue retries", publishNow: true }, ""],
    ["hot topic without sources", { kind: "hot_topic", topic: "Laravel 13 released" }, "sources"],
    ["non http source", { topic: "Laravel queue retries", sources: ["javascript:alert(1)"] }, "sources.0"],
    ["destinations without blog", { topic: "Laravel queue retries", destinations: ["linkedin"] }, "destinations"],
    ["unknown destination", { topic: "Laravel queue retries", destinations: ["blog", "tiktok"] }, "destinations.1"],
    ["bad pillar", { topic: "Laravel queue retries", pillar: "<script>" }, "pillar"],
    ["bad scheduledFor", { topic: "Laravel queue retries", scheduledFor: "tomorrow" }, "scheduledFor"],
  ];
  for (const [name, body, path] of bad) {
    it(`refuses a brief with ${name}`, async () => {
      const r = await call(handlers.createBrief(req("briefs", { body })));
      assert.equal(r.status, 400);
      assert.equal(r.json.error.code, "invalid_request");
      if (path) assert.ok(r.json.error.details.issues.some((i: { path: string }) => i.path === path), JSON.stringify(r.json));
      assert.equal(store.briefs.length, 0);
    });
  }

  it("refuses a body that is not JSON", async () => {
    const r = await call(handlers.createBrief(req("briefs", { body: "{nope" })));
    assert.equal(r.status, 400);
    assert.equal(r.json.error.code, "invalid_json");
  });

  it("refuses an oversized body", async () => {
    const r = await call(handlers.createBrief(req("briefs", { body: { topic: "a".repeat(20_000) } })));
    assert.equal(r.status, 413);
  });

  it("refuses a scheduledFor in the past", async () => {
    const r = await call(
      handlers.createBrief(req("briefs", { body: { topic: "Laravel queue retries", scheduledFor: "2026-11-01T00:00:00Z" } }))
    );
    assert.equal(r.status, 400);
  });

  it("validates list queries and route params", async () => {
    assert.equal((await handlers.listDrafts(req("drafts?limit=500"))).status, 400);
    assert.equal((await handlers.listDrafts(req("drafts?kind=blog&state=manual"))).status, 400);
    assert.equal((await handlers.listDrafts(req("drafts?kind=video"))).status, 400);
    assert.equal((await handlers.listLogs(req("logs?status=boom"))).status, 400);
    assert.equal((await handlers.getDraft(req("drafts/page/x"), { kind: "page", id: "x" })).status, 400);
    assert.equal((await handlers.getDraft(req("drafts/blog/a%20b"), { kind: "blog", id: "a b" })).status, 400);
  });

  it("validates draft and pipeline actions", async () => {
    store.blogs.set("blog1", blog());
    assert.equal((await act("blog", "blog1", { action: "publish" })).status, 400);
    assert.equal((await act("blog", "blog1", { action: "schedule" })).status, 400);
    assert.equal((await act("blog", "blog1", { action: "pause", at: "2026-11-05T10:00:00Z" })).status, 400);
    const p = await call(handlers.actOnPipeline(req("pipeline", { body: { action: "approve" } })));
    assert.equal(p.status, 400);
    assert.equal(store.logs.length, 0);
  });
});

/* ------------------------------------------------------------------ */
/* Briefs and the duplicate check                                     */
/* ------------------------------------------------------------------ */

describe("briefs", () => {
  it("adds a brief as origin jarvis and logs it with source jarvis", async () => {
    const r = await call(
      handlers.createBrief(
        req("briefs", {
          body: {
            topic: `Laravel queue retries ${EM_DASH} what we learned`,
            take: "Retries hid a lock problem",
            sources: ["https://laravel.com/docs/queues", "https://example.com/post"],
            destinations: ["blog", "linkedin"],
          },
        })
      )
    );
    assert.equal(r.status, 201);
    assert.equal(r.json.brief.origin, "jarvis");
    assert.equal(r.json.brief.status, "queued");
    assert.equal(r.json.brief.topic.includes(EM_DASH), false, "em dash stripped");
    assert.equal(r.json.brief.sourceUrl, "https://laravel.com/docs/queues");
    assert.deepEqual(r.json.destinations, ["blog", "linkedin"]);
    assert.equal(store.briefs[0].extraInstructions.includes("https://example.com/post"), true);
    const log = store.logs.at(-1)!;
    assert.equal(log.refType, "Brief");
    assert.equal(log.meta.source, "jarvis");
    assert.equal(log.meta.action, "create_brief");
  });

  it("a hot topic goes to Timely and requires a live source", async () => {
    const r = await call(
      handlers.createBrief(
        req("briefs", { body: { kind: "hot_topic", topic: "Laravel 13 queue changes", sources: ["https://laravel.com/blog"] } })
      )
    );
    assert.equal(r.status, 201);
    assert.equal(r.json.brief.pillar, "Timely");
    assert.equal(r.json.brief.requiresLiveSource, true);
  });

  it("refuses an exact queued topic", async () => {
    await handlers.createBrief(req("briefs", { body: { topic: "Laravel queue retries" } }));
    const r = await call(handlers.createBrief(req("briefs", { body: { topic: "laravel QUEUE retries" } })));
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "duplicate");
    assert.equal(store.briefs.length, 1);
  });

  it("refuses a topic the duplicate check blocks, with the matches", async () => {
    store.dup = {
      blocked: true,
      risk: 0.93,
      reason: "Similar content already exists",
      matches: [{ kind: "blog", title: "Laravel queue retries", url: "https://twixrsolutions.com/blog/x", score: 0.93, reason: "Overlapping existing blog" }],
    };
    const r = await call(handlers.createBrief(req("briefs", { body: { topic: "Retrying Laravel queues" } })));
    assert.equal(r.status, 409);
    assert.equal(r.json.error.details.matches.length, 1);
    assert.equal(store.briefs.length, 0);
    assert.equal(store.logs.length, 0);
  });

  it("creates a related but unblocked topic and reports the matches", async () => {
    store.dup = { blocked: false, risk: 0.6, reason: "Related content found (not blocked)", matches: [{ kind: "brief", title: "Laravel queues", score: 0.6, reason: "Similar brief (used)" }] };
    const r = await call(handlers.createBrief(req("briefs", { body: { topic: "Laravel queue retries" } })));
    assert.equal(r.status, 201);
    assert.equal(r.json.duplicateCheck.matches.length, 1);
  });

  it("lists briefs with a cursor", async () => {
    for (const t of ["Laravel one topic", "Laravel two topic", "Laravel three topic"]) {
      await handlers.createBrief(req("briefs", { body: { topic: t } }));
    }
    const r = await call(handlers.listBriefs(req("briefs?limit=2")));
    assert.equal(r.json.items.length, 2);
    assert.equal(r.json.nextCursor, r.json.items[1].id);
  });
});

/* ------------------------------------------------------------------ */
/* Draft actions                                                       */
/* ------------------------------------------------------------------ */

describe("states", () => {
  it("derives states from the pipeline columns", () => {
    assert.equal(blogStateOf({ published: true, reviewState: "approved", reviewReasons: [] }), "published");
    assert.equal(blogStateOf({ published: false, reviewState: "approved", reviewReasons: [] }), "scheduled");
    assert.equal(blogStateOf({ published: false, reviewState: "none", reviewReasons: [] }), "discarded");
    assert.equal(blogStateOf({ published: false, reviewState: "needs_review", reviewReasons: [PAUSE_MARKER] }), "paused");
    assert.equal(socialStateOf({ status: "needs_review", reviewReasons: ["x"] }), "needs_review");
    assert.equal(socialStateOf({ status: "manual", reviewReasons: [] }), "manual");
  });

  it("allows only the moves in the table", () => {
    assert.deepEqual(transitionFor("approve", "needs_review"), { ok: true, to: "scheduled" });
    assert.equal(transitionFor("approve", "published").ok, false);
    assert.equal(transitionFor("pause", "needs_review").ok, false);
    assert.equal(transitionFor("resume", "scheduled").ok, false);
    assert.deepEqual(transitionFor("schedule", "scheduled"), { ok: true, to: "scheduled" });
  });
});

describe("blog actions", () => {
  it("approve: needs_review to scheduled at a drawn time, logged as jarvis", async () => {
    store.blogs.set("blog1", blog());
    const r = await act("blog", "blog1", { action: "approve" });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.draft.state, "scheduled");
    assert.equal(r.json.draft.publishAt, DRAWN_BLOG_AT.toISOString());
    const saved = store.blogs.get("blog1")!;
    assert.equal(saved.reviewState, "approved");
    assert.equal(saved.published, false, "approve never publishes; the tick does");
    assert.deepEqual(saved.reviewReasons, []);
    const log = store.logs.at(-1)!;
    assert.equal(log.status, "ok");
    assert.equal(log.meta.source, "jarvis");
    assert.equal(log.meta.action, "approve");
  });

  for (const [name, over, pattern] of [
    ["a critic score under the floor", { criticScore: 55 }, /below hard floor 60/],
    ["no critic score", { criticScore: null }, /No critic score/],
    ["an em dash", { body: `${GOOD_BODY} One more ${EM_DASH} line.` }, /dash/],
    ["a banned phrase", { body: `${GOOD_BODY} This is seamless.` }, /Banned phrase/],
    ["a placeholder", { body: `${GOOD_BODY} TODO add numbers.` }, /Unfinished content/],
    ["a thin body", { body: "## Short\n\nToo short." }, /too short/],
  ] as Array<[string, Partial<BlogDetail>, RegExp]>) {
    it(`approve is refused by the quality gate for ${name}`, async () => {
      store.blogs.set("blog1", blog(over));
      const r = await act("blog", "blog1", { action: "approve" });
      assert.equal(r.status, 422);
      assert.equal(r.json.error.code, "quality_gate");
      assert.ok(r.json.error.details.reasons.some((x: string) => pattern.test(x)), JSON.stringify(r.json));
      assert.equal(store.blogs.get("blog1")!.reviewState, "needs_review", "unchanged");
      assert.equal(store.logs.at(-1)!.status, "warn", "refusal is logged");
    });
  }

  it("approve is refused for an invented internal link", async () => {
    store.allowlist = new Set(["https://twixrsolutions.com/blog"]);
    store.blogs.set("blog1", blog({ body: `${GOOD_BODY} See [this](https://twixrsolutions.com/blog/made-up).` }));
    const r = await act("blog", "blog1", { action: "approve" });
    assert.equal(r.status, 422);
  });

  it("schedule sets the exact time; past or far times are refused", async () => {
    store.blogs.set("blog1", blog());
    const at = "2026-11-06T09:30:00.000Z";
    const r = await act("blog", "blog1", { action: "schedule", at });
    assert.equal(r.status, 200);
    assert.equal(r.json.draft.publishAt, at);
    assert.equal((await act("blog", "blog1", { action: "schedule", at: "2026-11-04T09:00:00Z" })).status, 400);
    assert.equal((await act("blog", "blog1", { action: "schedule", at: "2027-06-01T09:00:00Z" })).status, 400);
  });

  it("schedule is refused while a linked LinkedIn post would go out first", async () => {
    const li = social({ status: "scheduled", scheduledFor: new Date(NOW.getTime() + 2 * HOUR) });
    store.blogs.set("blog1", blog({ reviewState: "approved", publishAt: new Date(NOW.getTime() + HOUR), social: [li] }));
    const r = await act("blog", "blog1", { action: "schedule", at: "2026-11-06T09:30:00Z" });
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "linked_social");
    assert.deepEqual(r.json.error.details.socialPostIds, ["li1"]);
  });

  it("pause then resume a scheduled blog, keeping its time", async () => {
    const publishAt = new Date(NOW.getTime() + 5 * HOUR);
    store.blogs.set("blog1", blog({ reviewState: "approved", reviewReasons: [], publishAt }));
    const p = await act("blog", "blog1", { action: "pause", reason: "Client asked to hold" });
    assert.equal(p.status, 200);
    assert.equal(p.json.draft.state, "paused");
    const paused = store.blogs.get("blog1")!;
    assert.equal(paused.reviewState, "needs_review", "the tick only publishes approved posts");
    assert.deepEqual(paused.reviewReasons, [PAUSE_MARKER, "reason: Client asked to hold"]);

    const r = await act("blog", "blog1", { action: "resume" });
    assert.equal(r.status, 200);
    assert.equal(r.json.draft.state, "scheduled");
    assert.equal(r.json.draft.publishAt, publishAt.toISOString());
    assert.deepEqual(store.logs.map((l) => l.meta.action), ["pause", "resume"]);
  });

  it("resume re-runs the quality gate", async () => {
    store.blogs.set("blog1", blog({ reviewReasons: [PAUSE_MARKER], criticScore: 40 }));
    assert.equal((await act("blog", "blog1", { action: "resume" })).status, 422);
  });

  it("pause is refused while LinkedIn posts for the blog are scheduled", async () => {
    store.blogs.set("blog1", blog({ reviewState: "approved", publishAt: new Date(NOW.getTime() + HOUR), social: [social({ status: "scheduled" })] }));
    const r = await act("blog", "blog1", { action: "pause" });
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "linked_social");
  });

  it("refuses moves outside the table", async () => {
    store.blogs.set("blog1", blog({ published: true, reviewState: "approved" }));
    const r = await act("blog", "blog1", { action: "approve" });
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "invalid_transition");
    store.blogs.set("blog2", blog({ id: "blog2" }));
    assert.equal((await act("blog", "blog2", { action: "pause" })).status, 409);
    assert.equal((await act("blog", "blog2", { action: "resume" })).status, 409);
    assert.equal(store.logs.length, 0);
  });

  it("returns 404 for a missing or manual (CMS) post", async () => {
    store.blogs.set("cms1", blog({ id: "cms1", origin: "manual" }));
    assert.equal((await act("blog", "nope", { action: "approve" })).status, 404);
    assert.equal((await act("blog", "cms1", { action: "approve" })).status, 404);
  });

  it("returns 409 conflict when the draft moved under the request", async () => {
    store.blogs.set("blog1", blog());
    store.raceNextUpdate = true;
    const r = await act("blog", "blog1", { action: "approve" });
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "conflict");
  });
});

describe("social actions", () => {
  it("approve: needs_review to scheduled after its live blog", async () => {
    store.socials.set("li1", social());
    const r = await act("social", "li1", { action: "approve" });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.draft.state, "scheduled");
    assert.equal(r.json.draft.scheduledFor, DRAWN_LI_AT.toISOString());
    assert.equal(store.logs.at(-1)!.meta.source, "jarvis");
  });

  it("approve is refused while the linked blog is not approved", async () => {
    store.socials.set("li1", social({ blog: { published: false, reviewState: "needs_review", publishAt: null } }));
    const r = await act("social", "li1", { action: "approve" });
    assert.equal(r.status, 422);
    assert.ok(r.json.error.details.reasons.some((x: string) => /not approved/.test(x)));
  });

  it("schedule is refused before the linked blog goes live", async () => {
    store.socials.set("li1", social({ blog: { published: false, reviewState: "approved", publishAt: new Date("2026-11-07T00:00:00Z") } }));
    assert.equal((await act("social", "li1", { action: "schedule", at: "2026-11-06T09:00:00Z" })).status, 422);
  });

  it("approve is refused for a dash or a low critic score", async () => {
    store.socials.set("li1", social({ body: `${social().body} ${EM_DASH}` }));
    assert.equal((await act("social", "li1", { action: "approve" })).status, 422);
    store.socials.set("li2", social({ id: "li2", criticScore: 10 }));
    assert.equal((await act("social", "li2", { action: "approve" })).status, 422);
  });

  it("pause and resume", async () => {
    store.socials.set("li1", social({ status: "scheduled", scheduledFor: new Date(NOW.getTime() + 3 * HOUR) }));
    assert.equal((await act("social", "li1", { action: "pause" })).json.draft.state, "paused");
    assert.equal(store.socials.get("li1")!.status, "needs_review");
    assert.equal((await act("social", "li1", { action: "resume" })).json.draft.state, "scheduled");
  });

  it("X drafts are manual and cannot be scheduled", async () => {
    store.socials.set("x1", social({ id: "x1", channel: "x", status: "manual" }));
    const r = await act("social", "x1", { action: "approve" });
    assert.equal(r.status, 409);
  });
});

/* ------------------------------------------------------------------ */
/* Pipeline and reads                                                  */
/* ------------------------------------------------------------------ */

describe("pipeline", () => {
  it("pause and resume are logged and reported by status", async () => {
    const p = await call(handlers.actOnPipeline(req("pipeline", { body: { action: "pause", reason: "Travelling" } })));
    assert.equal(p.status, 200);
    assert.equal(p.json.pipeline.paused, true);
    const s = await call(handlers.status(req("status")));
    assert.equal(s.json.pipeline.paused, true);
    assert.equal(s.json.pipeline.running, false);
    assert.equal(s.json.pipeline.pauseReason, "Travelling");

    assert.equal((await handlers.actOnPipeline(req("pipeline", { body: { action: "pause" } }))).status, 409);
    const r = await call(handlers.actOnPipeline(req("pipeline", { body: { action: "resume" } })));
    assert.equal(r.json.pipeline.paused, false);
    assert.equal((await handlers.actOnPipeline(req("pipeline", { body: { action: "resume" } }))).status, 409);
    assert.deepEqual(
      store.logs.map((l) => [l.refType, l.meta.source, l.meta.action]),
      [["Pipeline", "jarvis", "pause"], ["Pipeline", "jarvis", "resume"]]
    );
  });

  it("the cron's pause check: off without a database, fails closed on a read error", async () => {
    const original = { ...pauseSource };
    try {
      assert.equal(await isPipelinePaused(), false, "no database configured");
      pauseSource.configured = () => true;
      pauseSource.read = async () => null;
      assert.equal(await isPipelinePaused(), false, "never paused");
      pauseSource.read = async () => ({ paused: true, at: NOW, reason: "" });
      assert.equal(await isPipelinePaused(), true);
      pauseSource.read = async () => {
        throw new Error("connection reset");
      };
      assert.equal(await isPipelinePaused(), true, "read error counts as paused");
    } finally {
      Object.assign(pauseSource, original);
    }
  });

  it("status reports the day plan, next runs and recent runs", async () => {
    store.plan = { day: "2026-11-04", go: true, slots: 1, generatedCount: 0, generateAt: DRAWN_LI_AT, secondAt: null, reason: "posting day" };
    const s = await call(handlers.status(req("status")));
    assert.equal(s.json.pipeline.enabled, true);
    assert.equal(s.json.pipeline.criticFloor, 60);
    assert.equal(s.json.today.planned, true);
    assert.equal(s.json.next.generateAt, DRAWN_LI_AT.toISOString());
    assert.equal(s.json.next.blogPublishAt, DRAWN_BLOG_AT.toISOString());
    assert.equal(s.json.lastRuns[0].runId, "run1");
    assert.equal(s.json.cron[0].path, "/api/cron/tick");
  });

  it("drafts list and detail include critic scores, body and logs", async () => {
    store.blogs.set("blog1", blog({ social: [social()] }));
    await act("blog", "blog1", { action: "approve" });
    const list = await call(handlers.listDrafts(req("drafts?kind=blog&state=scheduled")));
    assert.equal(list.json.items.length, 1);
    assert.equal(list.json.items[0].criticScore, 82);
    assert.equal(list.json.items[0].social[0].criticScore, 80);
    assert.equal("body" in list.json.items[0], false);
    const detail = await call(handlers.getDraft(req("drafts/blog/blog1"), { kind: "blog", id: "blog1" }));
    assert.equal(detail.json.draft.body, GOOD_BODY);
    assert.equal(detail.json.logs[0].source, "jarvis");
    const logs = await call(handlers.listLogs(req("logs?limit=1")));
    assert.equal(logs.json.items.length, 1);
  });
});

/* ------------------------------------------------------------------ */
/* Review fixes: metadata, sources, cover, override                    */
/* ------------------------------------------------------------------ */

describe("gate: metadata hard fails, sources and cover", () => {
  for (const [name, over, pattern] of [
    ["an empty title", { title: "  " }, /Title is empty/],
    ["an empty excerpt", { excerpt: "" }, /Excerpt \(meta description\) is empty/],
    ["an empty slug", { slug: "" }, /Slug is empty/],
    ["an unclean slug", { slug: "Laravel_Queue Retries" }, /Slug is not clean kebab-case/],
    ["a slug over 80 characters", { slug: `laravel-${"a".repeat(80)}` }, /Slug too long/],
    ["a missing cover image", { image: " " }, /Cover image missing/],
    [
      "a live-source brief without a source URL",
      { brief: { requiresLiveSource: true } },
      /requiresLiveSource brief needs at least one source URL/,
    ],
  ] as Array<[string, Partial<BlogDetail>, RegExp]>) {
    it(`approve is refused for ${name}`, async () => {
      store.blogs.set("blog1", blog(over));
      const r = await act("blog", "blog1", { action: "approve" });
      assert.equal(r.status, 422);
      assert.equal(r.json.error.code, "quality_gate");
      assert.ok(r.json.error.details.reasons.some((x: string) => pattern.test(x)), JSON.stringify(r.json));
      assert.equal(store.blogs.get("blog1")!.reviewState, "needs_review");
    });
  }

  it("a live-source brief with a real source in the body passes", async () => {
    const body = `${GOOD_BODY}\n\n## Sources\n\n- https://laravel.com/docs/queues`;
    store.blogs.set("blog1", blog({ body, brief: { requiresLiveSource: true } }));
    assert.equal((await act("blog", "blog1", { action: "approve" })).status, 200);
  });
});

describe("gate: override for findings it cannot re-check", () => {
  for (const [name, over] of [
    ["a dead link", { reviewReasons: ["Dead or unreachable link: https://example.com/gone"] }],
    ["a duplicate title", { reviewReasons: ["Duplicate title: Laravel queue retries"] }],
    ["a used topic", { reviewReasons: ["Topic already used in a prior brief: queues"] }],
    ["a critic score under the minimum", { criticScore: 70 }],
  ] as Array<[string, Partial<BlogDetail>]>) {
    it(`blog with ${name} needs override`, async () => {
      store.blogs.set("blog1", blog(over));
      const refused = await act("blog", "blog1", { action: "approve" });
      assert.equal(refused.status, 422);
      assert.equal(refused.json.error.code, "override_required");
      assert.equal(store.blogs.get("blog1")!.reviewState, "needs_review");

      const passed = await act("blog", "blog1", { action: "approve", override: true });
      assert.equal(passed.status, 200, JSON.stringify(passed.json));
      const log = store.logs.at(-1)!;
      assert.equal(log.meta.override, true);
      assert.ok(Array.isArray(log.meta.overridden) && (log.meta.overridden as string[]).length > 0);
    });
  }

  it("override never passes a hard failure", async () => {
    store.blogs.set("blog1", blog({ criticScore: 40 }));
    const r = await act("blog", "blog1", { action: "approve", override: true });
    assert.equal(r.status, 422);
    assert.equal(r.json.error.code, "quality_gate");
  });

  it("a LinkedIn post under the critic minimum needs override", async () => {
    store.socials.set("li1", social({ criticScore: 70 }));
    assert.equal((await act("social", "li1", { action: "approve" })).json.error.code, "override_required");
    assert.equal((await act("social", "li1", { action: "approve", override: true })).status, 200);
  });

  it("an unconfirmed LinkedIn publish needs override before approve", async () => {
    store.socials.set(
      "li1",
      social({ reviewReasons: ["LinkedIn publish not confirmed, check the profile before retrying"] }),
    );
    assert.equal((await act("social", "li1", { action: "approve" })).json.error.code, "override_required");
    assert.equal((await act("social", "li1", { action: "approve", override: true })).status, 200);
  });

  it("pause takes no override", async () => {
    store.blogs.set("blog1", blog({ reviewState: "approved", publishAt: new Date(NOW.getTime() + HOUR) }));
    assert.equal((await act("blog", "blog1", { action: "pause", override: true })).status, 400);
  });
});

/* ------------------------------------------------------------------ */
/* Review fixes: link guards inside the write                          */
/* ------------------------------------------------------------------ */

describe("link guards evaluated at write time", () => {
  it("blog schedule fails with conflict if a LinkedIn post was scheduled earlier after the read", async () => {
    store.blogs.set("blog1", blog());
    // The read shows no social post; one lands before the write.
    store.socials.set("li1", social({ status: "scheduled", scheduledFor: new Date(NOW.getTime() + 2 * HOUR) }));
    const r = await act("blog", "blog1", { action: "schedule", at: "2026-11-06T09:30:00Z" });
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "conflict");
    assert.equal(store.blogs.get("blog1")!.reviewState, "needs_review");
  });

  it("blog pause fails with conflict if a LinkedIn post was scheduled after the read", async () => {
    store.blogs.set("blog1", blog({ reviewState: "approved", publishAt: new Date(NOW.getTime() + HOUR) }));
    store.socials.set("li1", social({ status: "scheduled", scheduledFor: new Date(NOW.getTime() + 9 * HOUR) }));
    assert.equal((await act("blog", "blog1", { action: "pause" })).json.error.code, "conflict");
  });

  it("social schedule fails with conflict if its blog was paused after the read", async () => {
    // Read sees an approved blog; the store's row is already paused.
    store.blogs.set("blog1", blog({ reviewReasons: [PAUSE_MARKER] }));
    store.socials.set(
      "li1",
      social({ blog: { published: false, reviewState: "approved", publishAt: new Date(NOW.getTime() + HOUR) } })
    );
    const r = await act("social", "li1", { action: "approve" });
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "conflict");
    assert.equal(store.socials.get("li1")!.status, "needs_review");
  });
});

/* ------------------------------------------------------------------ */
/* Review fixes: resume backlog                                        */
/* ------------------------------------------------------------------ */

describe("resume backlog", () => {
  it("pipeline resume spreads past-due blogs and LinkedIn posts forward", async () => {
    store.control = { paused: true, at: NOW, reason: "" };
    const old1 = new Date(NOW.getTime() - 30 * HOUR);
    const old2 = new Date(NOW.getTime() - 10 * HOUR);
    store.blogs.set("b1", blog({ id: "b1", reviewState: "approved", publishAt: old1 }));
    store.blogs.set("b2", blog({ id: "b2", reviewState: "approved", publishAt: old2 }));
    store.socials.set("li1", social({ status: "scheduled", scheduledFor: old2, blogPostId: "b1" }));
    store.due = {
      blogs: [
        { id: "b1", slug: "b1", publishAt: old1, social: [{ id: "li1", scheduledFor: old2 }] },
        { id: "b2", slug: "b2", publishAt: old2, social: [] },
      ],
      social: [{ id: "li1", scheduledFor: old2, blogPostId: "b1", blogPublished: false, blogPublishAt: old1 }],
      lastScheduledBlogAt: null,
      held: [],
      more: false,
    };
    const r = await call(handlers.actOnPipeline(req("pipeline", { body: { action: "resume" } })));
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const [m1, m2] = r.json.rescheduled.blogs;
    const b1At = drawBlog(NOW);
    const b2At = drawBlog(new Date(b1At.getTime() + 5 * HOUR));
    assert.equal(m1.to, b1At.toISOString());
    assert.equal(m2.to, b2At.toISOString(), "second blog waits the minimum gap after the first");
    assert.equal(r.json.rescheduled.social[0].to, drawLi(b1At).toISOString(), "LinkedIn after its blog's new time");
    for (const m of [...r.json.rescheduled.blogs, ...r.json.rescheduled.social]) {
      assert.ok(new Date(m.to).getTime() > NOW.getTime(), "nothing left past due");
    }
    assert.equal(store.blogs.get("b2")!.publishAt!.toISOString(), b2At.toISOString());
  });

  it("the backlog queues after blogs already scheduled", async () => {
    store.control = { paused: true, at: NOW, reason: "" };
    const last = new Date(NOW.getTime() + 40 * HOUR);
    store.due = {
      blogs: [{ id: "b1", slug: "b1", publishAt: new Date(NOW.getTime() - HOUR), social: [] }],
      social: [],
      lastScheduledBlogAt: last,
      held: [],
      more: false,
    };
    const r = await call(handlers.actOnPipeline(req("pipeline", { body: { action: "resume" } })));
    assert.equal(r.json.rescheduled.blogs[0].to, drawBlog(new Date(last.getTime() + 5 * HOUR)).toISOString());
  });

  it("pause moves nothing, and a raced switch is a conflict", async () => {
    store.due = { blogs: [{ id: "b1", slug: "b1", publishAt: NOW, social: [] }], social: [], lastScheduledBlogAt: null, held: [], more: false };
    const p = await call(handlers.actOnPipeline(req("pipeline", { body: { action: "pause" } })));
    assert.deepEqual(p.json.rescheduled, { blogs: [], social: [] });
    store.racePipeline = true;
    const r = await call(handlers.actOnPipeline(req("pipeline", { body: { action: "resume" } })));
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "conflict");
  });

  it("draft resume redraws a past-due time forward", async () => {
    store.blogs.set("blog1", blog({ reviewReasons: [PAUSE_MARKER], publishAt: new Date(NOW.getTime() - 3 * HOUR) }));
    const r = await act("blog", "blog1", { action: "resume" });
    assert.equal(r.json.draft.publishAt, DRAWN_BLOG_AT.toISOString());
    store.socials.set("li1", social({ reviewReasons: [PAUSE_MARKER], scheduledFor: new Date(NOW.getTime() - HOUR) }));
    const s = await act("social", "li1", { action: "resume" });
    assert.equal(s.json.draft.scheduledFor, DRAWN_LI_AT.toISOString());
  });
});

/* ------------------------------------------------------------------ */
/* Review fixes: nits                                                  */
/* ------------------------------------------------------------------ */

describe("brief insert is atomic with its duplicate check", () => {
  it("a parallel insert of the same topic is refused as duplicate", async () => {
    store.hiddenQueuedTopic = "Laravel queue retries";
    const r = await call(handlers.createBrief(req("briefs", { body: { topic: "Laravel queue retries" } })));
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "duplicate");
    assert.equal(store.briefs.length, 0);
  });
});

describe("body cap", () => {
  it("refuses by Content-Length before reading", async () => {
    const r = await call(
      handlers.createBrief(req("briefs", { body: { topic: "Laravel queue retries" }, headers: { "content-length": "999999" } }))
    );
    assert.equal(r.status, 413);
    assert.equal(store.briefs.length, 0);
  });
});

describe("source URLs must be public", () => {
  const blocked = [
    "http://127.0.0.1/",
    "http://localhost:3000/x",
    "http://app.localhost/",
    "http://169.254.169.254/latest/meta-data",
    "http://10.0.0.5/",
    "http://172.20.1.1/",
    "http://192.168.1.1/",
    "http://100.64.0.1/",
    "http://0.0.0.0/",
    "http://2130706433/",
    "http://0x7f000001/",
    "http://[::1]/",
    "http://[fd00::1]/",
    "http://[fe80::1]/",
    "http://[::ffff:127.0.0.1]/",
    "http://metadata.google.internal/",
    "https://db.internal/",
    "ftp://example.com/file",
    "https://laravel.com:8443/news",
    "http://8.8.8.8:6379/",
    "http://[2001::1]/",
    "http://192.88.99.1/",
  ];
  for (const url of blocked) {
    it(`refuses ${url}`, async () => {
      const r = await call(handlers.createBrief(req("briefs", { body: { topic: "Laravel queue retries", sources: [url] } })));
      assert.equal(r.status, 400, JSON.stringify(r.json));
    });
  }

  it("accepts public hosts", () => {
    assert.equal(isPublicHost("laravel.com"), true);
    assert.equal(isPublicHost("8.8.8.8"), true);
    assert.equal(isPublicHost("[2606:4700::1111]"), true);
    assert.equal(isPublicHost("172.32.0.1"), true);
  });
});

/* ------------------------------------------------------------------ */
/* Second review: linked LinkedIn posts on resume, batches, publishing */
/* ------------------------------------------------------------------ */

describe("resume moves a moved blog's LinkedIn posts with it", () => {
  it("short pause: blog past due, its LinkedIn post due in about 12 hours", async () => {
    store.control = { paused: true, at: NOW, reason: "" };
    const blogWas = new Date(NOW.getTime() - HOUR);
    const liWas = new Date(NOW.getTime() + 12 * HOUR);
    store.blogs.set("b1", blog({ id: "b1", reviewState: "approved", publishAt: blogWas }));
    store.socials.set("li1", social({ status: "scheduled", scheduledFor: liWas, blogPostId: "b1" }));
    store.due = {
      blogs: [{ id: "b1", slug: "b1", publishAt: blogWas, social: [{ id: "li1", scheduledFor: liWas }] }],
      social: [], // not past due itself
      lastScheduledBlogAt: null,
      held: [],
      more: false,
    };
    const r = await call(handlers.actOnPipeline(req("pipeline", { body: { action: "resume" } })));
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const blogTo = new Date(r.json.rescheduled.blogs[0].to);
    assert.equal(blogTo.toISOString(), drawBlog(NOW).toISOString());
    assert.ok(blogTo.getTime() > liWas.getTime(), "the blog's new time is after the post's old time");
    const li = r.json.rescheduled.social.find((m: { id: string }) => m.id === "li1");
    assert.ok(li, "the LinkedIn post moved too");
    assert.equal(li.blogId, "b1");
    assert.equal(li.to, drawLi(blogTo).toISOString(), "LinkedIn delay drawn from the blog's new time");
    assert.ok(store.socials.get("li1")!.scheduledFor > store.blogs.get("b1")!.publishAt!);
  });

  it("a linked post already after the blog's new time stays put", async () => {
    store.control = { paused: true, at: NOW, reason: "" };
    const later = new Date(NOW.getTime() + 60 * HOUR);
    store.due = {
      blogs: [{ id: "b1", slug: "b1", publishAt: new Date(NOW.getTime() - HOUR), social: [{ id: "li1", scheduledFor: later }] }],
      social: [],
      lastScheduledBlogAt: null,
      held: [],
      more: false,
    };
    const r = await call(handlers.actOnPipeline(req("pipeline", { body: { action: "resume" } })));
    assert.deepEqual(r.json.rescheduled.social, []);
  });

  it("a capped batch moves work but keeps the pipeline paused until the rest is moved", async () => {
    store.control = { paused: true, at: NOW, reason: "" };
    store.due = {
      blogs: [{ id: "b1", slug: "b1", publishAt: new Date(NOW.getTime() - HOUR), social: [] }],
      social: [],
      lastScheduledBlogAt: null,
      held: ["b9"],
      more: true,
    };
    const first = await call(handlers.actOnPipeline(req("pipeline", { body: { action: "resume" } })));
    assert.equal(first.status, 200);
    assert.equal(first.json.pipeline.paused, true);
    assert.equal(first.json.resume.complete, false);
    assert.deepEqual(first.json.resume.held, ["b9"]);
    assert.equal(first.json.rescheduled.blogs.length, 1);
    assert.equal(store.logs.at(-1)!.refType, "PipelineBacklog");
    assert.equal(store.control?.paused, true, "switch not flipped");

    store.due = { blogs: [], social: [], lastScheduledBlogAt: null, held: [], more: false };
    const second = await call(handlers.actOnPipeline(req("pipeline", { body: { action: "resume" } })));
    assert.equal(second.json.pipeline.paused, false);
    assert.equal(second.json.resume.complete, true);
    assert.equal(store.control?.paused, false);
  });
});

describe("publishing counts as going out", () => {
  it("a blog cannot be paused or scheduled past a LinkedIn post that is publishing", async () => {
    const li = social({ status: "publishing", scheduledFor: new Date(NOW.getTime() - 5 * 60_000) });
    store.blogs.set("blog1", blog({ reviewState: "approved", publishAt: new Date(NOW.getTime() + HOUR), social: [li] }));
    const p = await act("blog", "blog1", { action: "pause" });
    assert.equal(p.json.error.code, "linked_social");
    const s = await act("blog", "blog1", { action: "schedule", at: "2026-11-06T09:30:00Z" });
    assert.equal(s.json.error.code, "linked_social");
  });

  it("publishing is a readable, read-only state", async () => {
    assert.equal(socialStateOf({ status: "publishing", reviewReasons: [] }), "publishing");
    store.socials.set("li1", social({ status: "publishing" }));
    assert.equal((await act("social", "li1", { action: "pause" })).json.error.code, "invalid_transition");
  });
});

describe("source hosts: IPv4 inside IPv6 and reserved ranges", () => {
  for (const url of [
    "http://[::127.0.0.1]/",
    "http://[::ffff:10.0.0.1]/",
    "http://[64:ff9b::7f00:1]/",
    "http://[2002:7f00:1::]/",
    "http://[2001:db8::1]/",
    "http://198.18.0.1/",
    "http://198.19.255.1/",
    "http://192.0.2.10/",
    "http://198.51.100.10/",
    "http://203.0.113.10/",
    "http://[ff02::1]/",
  ]) {
    it(`refuses ${url}`, async () => {
      const r = await call(handlers.createBrief(req("briefs", { body: { topic: "Laravel queue retries", sources: [url] } })));
      assert.equal(r.status, 400);
    });
  }
  it("still accepts public IPv4-mapped addresses", () => {
    assert.equal(isPublicHost(new URL("http://[::ffff:8.8.8.8]/").hostname), true);
  });
});

describe("conditional write (expect)", () => {
  const blogSeen = () => ({ state: "needs_review", updatedAt: blog().updatedAt.toISOString() });
  const liSeen = () => ({ state: "needs_review", scheduledFor: social().scheduledFor.toISOString() });

  it("writes when the blog still matches what Jarvis saw", async () => {
    store.blogs.set("blog1", blog());
    const r = await act("blog", "blog1", { action: "approve", expect: blogSeen() });
    assert.equal(r.status, 200);
    assert.equal(r.json.draft.state, "scheduled");
  });

  it("refuses a blog whose state or updatedAt moved, with the current values, writing nothing", async () => {
    store.blogs.set("blog1", blog());
    const later = new Date(NOW.getTime() - 30_000);
    const cases = [
      { state: "paused", updatedAt: blog().updatedAt.toISOString() },
      { state: "needs_review", updatedAt: later.toISOString() },
    ];
    for (const expect of cases) {
      const r = await act("blog", "blog1", { action: "approve", expect });
      assert.equal(r.status, 409);
      assert.equal(r.json.error.code, "conflict");
      assert.deepEqual(r.json.error.details, { state: "needs_review", updatedAt: blog().updatedAt.toISOString() });
    }
    assert.equal(store.logs.length, 0);
    assert.equal(blogStateOf(store.blogs.get("blog1")!), "needs_review");
  });

  it("answers conflict, not invalid_transition or quality_gate, when the expected state is stale", async () => {
    store.blogs.set("blog1", blog({ reviewState: "approved", publishAt: DRAWN_BLOG_AT, criticScore: 10 }));
    const r = await act("blog", "blog1", { action: "approve", expect: blogSeen() });
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "conflict");
    assert.equal(r.json.error.details.state, "scheduled");
    assert.equal(store.logs.length, 0);
  });

  it("re-checks a blog inside the write: a change that lands after the read is a conflict", async () => {
    store.blogs.set("blog1", blog());
    const changedAt = new Date(NOW.getTime() - 1000);
    store.beforeWrite = () => {
      store.blogs.set("blog1", blog({ reviewReasons: [PAUSE_MARKER], updatedAt: changedAt }));
    };
    const r = await act("blog", "blog1", { action: "approve", expect: blogSeen() });
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "conflict");
    assert.deepEqual(r.json.error.details, { state: "paused", updatedAt: changedAt.toISOString() });
    assert.equal(store.logs.length, 0);
  });

  it("says the expect check failed only when it did", async () => {
    store.blogs.set("blog1", blog());
    store.raceNextUpdate = true; // the write is refused for another reason; the row still matches expect
    const other = await act("blog", "blog1", { action: "approve", expect: blogSeen() });
    assert.equal(other.status, 409);
    assert.match(other.json.error.message, /changed while this request ran/);

    store.raceNextUpdate = false;
    store.socials.set("li1", social());
    store.beforeWrite = () => store.socials.set("li1", social({ reviewReasons: [PAUSE_MARKER] }));
    const stale = await act("social", "li1", { action: "approve", expect: liSeen() });
    assert.match(stale.json.error.message, /no longer in the state Jarvis expected/);
  });

  it("writes a LinkedIn post that still matches, and refuses one that moved", async () => {
    store.socials.set("li1", social());
    const ok = await act("social", "li1", { action: "approve", expect: liSeen() });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.draft.state, "scheduled");

    store.socials.set("li2", social({ id: "li2", status: "scheduled", scheduledFor: DRAWN_LI_AT }));
    const stale = await act("social", "li2", { action: "pause", expect: { state: "scheduled", scheduledFor: NOW.toISOString() } });
    assert.equal(stale.status, 409);
    assert.equal(stale.json.error.code, "conflict");
    assert.deepEqual(stale.json.error.details, { state: "scheduled", scheduledFor: DRAWN_LI_AT.toISOString() });
  });

  it("re-checks a LinkedIn post inside the write: a pause that keeps status and time still conflicts", async () => {
    store.socials.set("li1", social());
    // Same status column and time, so only the expect check can see it.
    store.beforeWrite = () => {
      store.socials.set("li1", social({ reviewReasons: [PAUSE_MARKER] }));
    };
    const r = await act("social", "li1", { action: "approve", expect: liSeen() });
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "conflict");
    assert.equal(r.json.error.details.state, "paused");
    assert.equal(store.socials.get("li1")!.status, "needs_review");
    assert.equal(store.logs.length, 0);
  });

  it("is optional: the same race without expect still writes when the guard columns match", async () => {
    store.socials.set("li1", social());
    store.beforeWrite = () => {
      store.socials.set("li1", social({ reviewReasons: [PAUSE_MARKER] }));
    };
    const r = await act("social", "li1", { action: "approve" });
    assert.equal(r.status, 200);
  });

  it("validates expect per kind", async () => {
    store.blogs.set("blog1", blog());
    store.socials.set("li1", social());
    const bad: Array<[string, string, unknown]> = [
      ["blog", "blog1", { state: "needs_review", scheduledFor: NOW.toISOString() }],
      ["blog", "blog1", { state: "publishing", updatedAt: NOW.toISOString() }],
      ["blog", "blog1", { state: "needs_review" }],
      ["blog", "blog1", { state: "needs_review", updatedAt: "yesterday" }],
      ["social", "li1", { state: "needs_review", updatedAt: NOW.toISOString() }],
      ["social", "li1", { state: "discarded", scheduledFor: NOW.toISOString() }],
      ["social", "li1", { state: "needs_review", scheduledFor: NOW.toISOString(), extra: 1 }],
    ];
    for (const [kind, id, expect] of bad) {
      const r = await act(kind, id, { action: "approve", expect });
      assert.equal(r.status, 400, JSON.stringify(expect));
      assert.equal(r.json.error.code, "invalid_request");
    }
    assert.equal(store.logs.length, 0);
  });
});

/* ------------------------------------------------------------------ */
/* Generator switch (JV-52b)                                           */
/* ------------------------------------------------------------------ */

const setGen = (generator: unknown, extra: Record<string, unknown> = {}) =>
  call(handlers.actOnPipeline(req("pipeline", { body: { action: "set_generator", generator, ...extra } })));

describe("generator switch", () => {
  it("defaults to site, switches to jarvis and back, logged and shown in status", async () => {
    const before = await call(handlers.status(req("status")));
    assert.equal(before.json.pipeline.generator, "site");
    assert.equal(before.json.pipeline.generatorChangedAt, null);

    const r = await setGen("jarvis", { reason: "JV-52b cut-over" });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.generator, { from: "site", to: "jarvis", changedAt: NOW.toISOString(), reason: "JV-52b cut-over" });
    const after = await call(handlers.status(req("status")));
    assert.equal(after.json.pipeline.generator, "jarvis");
    assert.equal(after.json.pipeline.generatorReason, "JV-52b cut-over");
    assert.equal(after.json.pipeline.paused, false, "the generator does not pause publishing");
    assert.equal(after.json.pipeline.running, true);

    assert.equal((await setGen("site")).status, 200);
    assert.deepEqual(
      store.logs.map((l) => [l.refType, l.refId, l.meta.source, l.meta.action, l.meta.from, l.meta.generator]),
      [
        ["PipelineGenerator", "generator", "jarvis", "set_generator", "site", "jarvis"],
        ["PipelineGenerator", "generator", "jarvis", "set_generator", "jarvis", "site"],
      ]
    );
  });

  it("setting the current value is an invalid transition and writes nothing", async () => {
    const r = await setGen("site");
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "invalid_transition");
    assert.equal(r.json.error.details.state, "site");
    assert.equal(store.logs.length, 0);
  });

  it("a switch that moved between read and write is a conflict", async () => {
    store.raceGenerator = true;
    const r = await setGen("jarvis");
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "conflict");
    assert.equal(store.logs.length, 0);
  });

  it("is independent of the pause switch", async () => {
    await call(handlers.actOnPipeline(req("pipeline", { body: { action: "pause" } })));
    await setGen("jarvis");
    const s = await call(handlers.status(req("status")));
    assert.equal(s.json.pipeline.paused, true);
    assert.equal(s.json.pipeline.generator, "jarvis");
    assert.equal(store.control?.paused, true, "a generator row never reads as a pause row");
  });

  it("validates the body strictly", async () => {
    for (const body of [
      { action: "set_generator" },
      { action: "set_generator", generator: "both" },
      { action: "set_generator", generator: "jarvis", extra: 1 },
      { action: "pause", generator: "jarvis" },
    ]) {
      const r = await call(handlers.actOnPipeline(req("pipeline", { body })));
      assert.equal(r.status, 400, JSON.stringify(body));
    }
    assert.equal(store.logs.length, 0);
  });

  it("the cron's generator check: allowed without a database, fails closed on a read error", async () => {
    const original = { ...generatorSource };
    const originalError = console.error;
    console.error = () => undefined;
    try {
      assert.deepEqual(await siteMayGenerate(), { allowed: true }, "no database configured");
      generatorSource.configured = () => true;
      generatorSource.read = async () => null;
      assert.deepEqual(await siteMayGenerate(), { allowed: true }, "no row means site");
      generatorSource.read = async () => ({ generator: "site", at: NOW, reason: "" });
      assert.deepEqual(await siteMayGenerate(), { allowed: true });
      generatorSource.read = async () => ({ generator: "jarvis", at: NOW, reason: "" });
      assert.deepEqual(await siteMayGenerate(), { allowed: false, reason: "jarvis" });
      generatorSource.read = async () => {
        throw new Error("connection reset");
      };
      assert.deepEqual(await siteMayGenerate(), { allowed: false, reason: "unreadable" });
    } finally {
      Object.assign(generatorSource, original);
      console.error = originalError;
    }
  });
});

/* ------------------------------------------------------------------ */
/* Intake (JV-52b)                                                     */
/* ------------------------------------------------------------------ */

const intake = (body: unknown, headers?: Record<string, string>) => call(handlers.submitIntake(req("intake", { body, headers })));

describe("intake: generator and validation", () => {
  it("is refused while the site generates, before any check or write", async () => {
    const r = await intake(intakeBody({ approve: true }));
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "generator_mismatch");
    assert.equal(r.json.error.details.generator, "site");
    assert.equal(store.blogs.size, 0);
    assert.equal(store.linkChecks.length, 0);
  });

  const bad: Array<[string, Record<string, unknown>, string]> = [
    ["an unknown key", { publishNow: true }, ""],
    ["a short idempotency key", { idempotencyKey: "abc" }, "idempotencyKey"],
    ["a key with spaces", { idempotencyKey: "has spaces here" }, "idempotencyKey"],
    ["no title", { title: "  " }, "title"],
    ["no body", { body: "" }, "body"],
    ["no critic score", { criticScore: undefined }, "criticScore"],
    ["a critic score over 100", { criticScore: 101 }, "criticScore"],
    ["an http cover", { coverImageUrl: "http://res.cloudinary.com/x.png" }, "coverImageUrl"],
    ["a private source", { sources: ["http://10.0.0.5/x"] }, "sources.0"],
    ["a bad publishAt", { publishAt: "soon" }, "publishAt"],
    ["an unknown LinkedIn key", { linkedin: { body: LI_BODY, post: true } }, "linkedin"],
    ["an unknown FAQ key", { faqs: [{ question: "Why?", answer: "Because", extra: 1 }] }, "faqs.0"],
  ];
  for (const [name, over, path] of bad) {
    it(`refuses ${name}`, async () => {
      store.generator = { generator: "jarvis", at: NOW, reason: "" };
      const r = await intake(intakeBody(over));
      assert.equal(r.status, 400, JSON.stringify(r.json));
      assert.equal(r.json.error.code, "invalid_request");
      if (path) assert.ok(r.json.error.details.issues.some((i: { path: string }) => i.path === path), JSON.stringify(r.json));
      assert.equal(store.blogs.size, 0);
    });
  }

  it("takes bodies up to 64 KB on this route only, and refuses more", async () => {
    store.generator = { generator: "jarvis", at: NOW, reason: "" };
    const long = `${GOOD_BODY}\n\n${SENTENCE.repeat(250)}`;
    assert.ok(JSON.stringify(intakeBody({ body: long })).length > 16 * 1024);
    const ok = await intake(intakeBody({ body: long }));
    assert.equal(ok.status, 201, JSON.stringify(ok.json));
    const big = await intake(intakeBody({ idempotencyKey: "jv-content-toolarge", body: "x".repeat(70_000) }));
    assert.equal(big.status, 413);
    const declared = await intake(intakeBody({ idempotencyKey: "jv-content-declared" }), { "content-length": "70000" });
    assert.equal(declared.status, 413);
    // The other routes keep 16 KB.
    const brief = await call(handlers.createBrief(req("briefs", { body: { topic: "a".repeat(20_000) } })));
    assert.equal(brief.status, 413);
  });

  it("refuses a publishAt outside 1 minute to 90 days", async () => {
    store.generator = { generator: "jarvis", at: NOW, reason: "" };
    for (const at of ["2026-11-04T09:00:00Z", "2027-06-01T00:00:00Z"]) {
      const r = await intake(intakeBody({ publishAt: at, approve: true }));
      assert.equal(r.status, 400);
      assert.equal(r.json.error.details.field, "publishAt");
    }
    assert.equal(store.blogs.size, 0);
  });
});

describe("intake: storing and scheduling", () => {
  beforeEach(() => {
    store.generator = { generator: "jarvis", at: NOW, reason: "" };
  });

  it("without approve, a passing blog and its LinkedIn copy are stored for review", async () => {
    const r = await intake(intakeBody({ linkedin: { body: LI_BODY, criticScore: 84 } }));
    assert.equal(r.status, 201, JSON.stringify(r.json));
    assert.equal(r.json.intake.replayed, false);
    assert.equal(r.json.blog.state, "needs_review");
    assert.equal(r.json.blog.publishAt, null);
    assert.equal(r.json.gates.blog.passed, true);
    assert.equal(r.json.gates.approveRequested, false);
    assert.equal(r.json.social.state, "needs_review");
    const b = store.blogs.get(r.json.blog.id);
    assert.equal(b?.published, false);
    assert.equal(b?.origin, "pipeline");
    assert.deepEqual(b?.reviewReasons, ["Submitted by Jarvis without approve"]);
    const li = store.socials.get(r.json.social.id);
    assert.equal(li?.blogPostId, r.json.blog.id);
    assert.ok((li?.reviewReasons as string[]).includes("Linked blog is not approved to publish yet"));
    assert.deepEqual(
      store.logs.map((l) => [l.refType, l.meta.source, l.meta.action]),
      [["BlogPost", "jarvis", "intake"], ["SocialPost", "jarvis", "intake"], ["Intake", "jarvis", "intake"]]
    );
  });

  it("with approve and every gate passing: scheduled at the next slot, LinkedIn after it, never published", async () => {
    const r = await intake(intakeBody({ approve: true, linkedin: { body: LI_BODY, criticScore: 84 } }));
    assert.equal(r.status, 201);
    assert.equal(r.json.blog.state, "scheduled");
    assert.equal(r.json.blog.publishAt, DRAWN_BLOG_AT.toISOString());
    assert.equal(r.json.social.state, "scheduled");
    assert.equal(r.json.social.scheduledFor, drawLi(DRAWN_BLOG_AT).toISOString());
    const b = store.blogs.get(r.json.blog.id);
    assert.equal(b?.reviewState, "approved");
    assert.equal(b?.published, false, "the tick publishes, intake never does");
    assert.deepEqual(b?.reviewReasons, []);
    assert.equal(store.socials.get(r.json.social.id)?.status, "scheduled");
  });

  it("the next slot queues the minimum gap after the last scheduled blog", async () => {
    store.latestScheduled = new Date(NOW.getTime() + 10 * HOUR);
    const r = await intake(intakeBody({ approve: true }));
    assert.equal(r.json.blog.publishAt, drawBlog(new Date(NOW.getTime() + 15 * HOUR)).toISOString());
  });

  it("an explicit publishAt is used exactly, and kept on a draft held for review", async () => {
    const at = "2026-11-06T09:30:00.000Z";
    const r = await intake(intakeBody({ approve: true, publishAt: at }));
    assert.equal(r.json.blog.publishAt, at);
    const held = await intake(intakeBody({ idempotencyKey: "jv-content-held", slug: "held-post", title: "A held post about queue retries", publishAt: at }));
    assert.equal(held.json.blog.state, "needs_review");
    assert.equal(held.json.blog.publishAt, at);
  });

  const heldBy: Array<[string, Record<string, unknown>, RegExp, "reasons" | "needsOverride"]> = [
    ["a critic score under the hard floor", { criticScore: 40 }, /below hard floor 60/, "reasons"],
    ["a critic score under the minimum", { criticScore: 70 }, /below minimum 78/, "needsOverride"],
    ["no cover image", { coverImageUrl: undefined }, /Cover image missing/, "reasons"],
    ["a markdown H1 inside the body", { body: `${GOOD_BODY}\n\n# A second title` }, /markdown H1/, "reasons"],
    ["a banned phrase", { excerpt: "In today's fast-paced world, queues matter for every single team out there." }, /Banned phrase/, "reasons"],
    ["a short body", { body: "## Short\n\nToo short to publish." }, /too short/, "reasons"],
    ["a live-source brief without sources", { requiresLiveSource: true }, /needs at least one source/, "reasons"],
    ["a placeholder", { body: `${GOOD_BODY}\n\nTODO add the numbers.` }, /Unfinished content/, "reasons"],
    ["a thin FAQ answer", { faqs: [{ question: "Does it retry?", answer: "Yes." }] }, /FAQ answer missing or too thin/, "reasons"],
  ];
  for (const [name, over, pattern, field] of heldBy) {
    it(`approve with ${name} is stored as needs_review with the reason`, async () => {
      const r = await intake(intakeBody({ approve: true, ...over }));
      assert.equal(r.status, 201, JSON.stringify(r.json));
      assert.equal(r.json.blog.state, "needs_review");
      assert.equal(r.json.gates.blog.passed, false);
      assert.ok(r.json.gates.blog[field].some((x: string) => pattern.test(x)), JSON.stringify(r.json.gates));
      const b = store.blogs.get(r.json.blog.id);
      assert.equal(b?.reviewState, "needs_review");
      assert.ok((b?.reviewReasons as string[]).some((x) => pattern.test(x)));
    });
  }

  it("checks external links (body, sources, cover) with the safe fetch and holds a dead one", async () => {
    const dead = "https://laravel.com/docs/queues-gone";
    store.deadUrls.add(dead);
    const body = `${GOOD_BODY}\n\nSee [the docs](${dead}) and [our services](https://www.twixrsolutions.com/services).`;
    const r = await intake(intakeBody({ approve: true, body, sources: ["https://laravel.com/docs/queues"] }));
    assert.equal(r.json.blog.state, "needs_review");
    assert.deepEqual(r.json.gates.blog.reasons, [`Dead or unreachable link: ${dead}`]);
    assert.deepEqual(store.linkChecks[0].sort(), [COVER, dead, "https://laravel.com/docs/queues"].sort());
  });

  it("holds a draft with more links than it will check, without fetching any", async () => {
    const links = Array.from({ length: MAX_LINK_CHECKS + 1 }, (_, i) => `- https://example.org/ref-${i}`).join("\n");
    const r = await intake(intakeBody({ approve: true, body: `${GOOD_BODY}\n\n${links}` }));
    assert.equal(r.json.blog.state, "needs_review");
    assert.ok(r.json.gates.blog.reasons.some((x: string) => /Too many external links/.test(x)));
    assert.equal(store.linkChecks.length, 0);
  });

  it("holds an invented internal link against the live inventory", async () => {
    store.allowlist = new Set(["https://www.twixrsolutions.com/services"]);
    const body = `${GOOD_BODY}\n\nRead [the guide](https://www.twixrsolutions.com/blog/made-up).`;
    const r = await intake(intakeBody({ approve: true, body }));
    assert.equal(r.json.blog.state, "needs_review");
    assert.ok(r.json.gates.blog.reasons.some((x: string) => /Invented or disallowed internal link/.test(x)));
  });

  it("an approved blog with a LinkedIn copy that fails its own gate: blog scheduled, LinkedIn held", async () => {
    const r = await intake(intakeBody({ approve: true, linkedin: { body: LI_BODY } }));
    assert.equal(r.json.blog.state, "scheduled");
    assert.equal(r.json.social.state, "needs_review");
    assert.equal(r.json.gates.social.passed, false);
    assert.ok(r.json.gates.social.reasons.some((x: string) => /No critic score recorded/.test(x)));
    const dashed = await intake(
      intakeBody({ idempotencyKey: "jv-content-li-dash", slug: "li-dash", title: "LinkedIn dash check post title", approve: true, linkedin: { body: `${LI_BODY} ${EM_DASH}`, criticScore: 90 } })
    );
    assert.equal(dashed.json.social.state, "scheduled", "the dash is normalised away, as the pipeline does");
    assert.doesNotMatch(store.socials.get(dashed.json.social.id)?.body ?? "", new RegExp(EM_DASH));
  });

  it("stores the normalised text (no dashes, no leading H1) and gates exactly that", async () => {
    const en = String.fromCodePoint(0x2013);
    const r = await intake(
      intakeBody({
        approve: true,
        title: `Laravel queue retries ${EM_DASH} after a lock timeout`,
        excerpt: `How a queue retry recovered ${en} without losing a single job in production.`,
        body: `# Laravel queue retries\n\n${GOOD_BODY} One more ${EM_DASH} line.`,
        faqs: [{ question: `Does it retry ${EM_DASH} always?`, answer: `Yes ${en} ${SENTENCE}` }],
      })
    );
    assert.equal(r.json.blog.state, "scheduled", JSON.stringify(r.json.gates));
    const b = store.blogs.get(r.json.blog.id);
    const stored = JSON.stringify([b?.title, b?.excerpt, b?.body, b?.faqs]);
    assert.doesNotMatch(stored, new RegExp(`[${EM_DASH}${en}]`));
    assert.doesNotMatch(b?.body ?? "", /^# /);
    assert.equal(b?.title, "Laravel queue retries - after a lock timeout");
  });
});

describe("intake: refusals and duplicates", () => {
  beforeEach(() => {
    store.generator = { generator: "jarvis", at: NOW, reason: "" };
  });

  it("refuses a metadata hard fail (unclean or long slug) with 422 and stores nothing", async () => {
    for (const slug of ["Bad Slug", "a".repeat(81)]) {
      const r = await intake(intakeBody({ slug, approve: true }));
      assert.equal(r.status, 422);
      assert.equal(r.json.error.code, "quality_gate");
      assert.ok(r.json.error.details.reasons.length);
    }
    assert.equal(store.blogs.size, 0);
    assert.deepEqual(store.logs.map((l) => [l.refType, l.status]), [["Intake", "warn"], ["Intake", "warn"]]);
    assert.equal(store.linkChecks.length, 0, "no network for a refused draft");
  });

  it("refuses a slug, a title (any case) or a topic that already exists", async () => {
    store.blogs.set("blog1", blog({ slug: "laravel-queue-retries-lock-timeout", title: "Something else entirely here" }));
    const bySlug = await intake(intakeBody());
    assert.equal(bySlug.status, 409);
    assert.equal(bySlug.json.error.code, "duplicate");
    assert.match(bySlug.json.error.details.matches[0].reason, /Slug already exists/);

    store.blogs.set("blog1", blog({ slug: "other", title: "LARAVEL QUEUE RETRIES AFTER A LOCK TIMEOUT" }));
    const byTitle = await intake(intakeBody());
    assert.equal(byTitle.status, 409);
    assert.match(byTitle.json.error.details.matches[0].reason, /Duplicate title/);

    store.blogs.clear();
    store.dup = {
      blocked: true,
      risk: 0.93,
      reason: "Cannibalizes an existing post",
      matches: [{ kind: "blog", title: "Queue retries in Laravel", url: "https://www.twixrsolutions.com/blog/q", score: 0.93, reason: "x" }],
    };
    const byTopic = await intake(intakeBody());
    assert.equal(byTopic.status, 409);
    assert.equal(byTopic.json.error.message, "Cannibalizes an existing post");
    assert.equal(byTopic.json.error.details.risk, 0.93);
    assert.equal([...store.blogs.values()].length, 0);
    assert.equal(store.intakes.size, 0);
    assert.ok(store.logs.every((l) => l.refType === "Intake" && l.status === "warn" && l.meta.source === "jarvis"));
  });

  it("a refused key is not consumed: the corrected draft goes in under the same key", async () => {
    assert.equal((await intake(intakeBody({ slug: "Bad Slug" }))).status, 422);
    const r = await intake(intakeBody());
    assert.equal(r.status, 201);
  });

  it("a slug taken between the check and the insert is a duplicate", async () => {
    store.hiddenSlug = "laravel-queue-retries-lock-timeout";
    const r = await intake(intakeBody());
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "duplicate");
    assert.equal(store.intakes.size, 0);
  });
});

describe("intake: idempotency", () => {
  beforeEach(() => {
    store.generator = { generator: "jarvis", at: NOW, reason: "" };
  });

  it("the same key and body returns the stored result with the drafts' current state", async () => {
    const first = await intake(intakeBody({ approve: true, linkedin: { body: LI_BODY, criticScore: 84 } }));
    assert.equal(first.status, 201);
    const again = await intake(intakeBody({ approve: true, linkedin: { body: LI_BODY, criticScore: 84 } }));
    assert.equal(again.status, 200);
    assert.equal(again.json.intake.replayed, true);
    assert.equal(again.json.blog.id, first.json.blog.id);
    assert.equal(again.json.social.id, first.json.social.id);
    assert.equal(again.json.blog.state, "scheduled");
    assert.deepEqual(again.json.gates, first.json.gates);
    assert.equal(store.blogs.size, 1, "nothing written twice");
    assert.equal(store.logs.length, 3);
    assert.equal(store.linkChecks.length, 1, "a replay does not fetch links again");
  });

  it("a replay still answers after the generator moved back to site", async () => {
    const first = await intake(intakeBody());
    store.generator = { generator: "site", at: NOW, reason: "" };
    const again = await intake(intakeBody());
    assert.equal(again.status, 200);
    assert.equal(again.json.blog.id, first.json.blog.id);
  });

  it("the same key with a different body is refused", async () => {
    await intake(intakeBody());
    const r = await intake(intakeBody({ title: "A different title about queue retries" }));
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "idempotency_mismatch");
    assert.equal(store.blogs.size, 1);
  });

  it("a parallel submit of the same key that committed first is replayed, not written twice", async () => {
    const body = intakeBody();
    store.blogs.set("blog-parallel", blog({ id: "blog-parallel", slug: "parallel", title: "Parallel" }));
    store.hiddenIntake = {
      key: String(body.idempotencyKey),
      payloadHash: intakePayloadHash(intakeSchema.parse(body)),
      blogPostId: "blog-parallel",
      socialPostId: null,
      gates: { approveRequested: false },
      createdAt: NOW,
    };
    const r = await intake(body);
    assert.equal(r.status, 200);
    assert.equal(r.json.intake.replayed, true);
    assert.equal(r.json.blog.id, "blog-parallel");
    assert.equal(store.blogs.size, 1);
  });
});

/* ------------------------------------------------------------------ */
/* Review fixes                                                        */
/* ------------------------------------------------------------------ */

describe("intake: unsafe markup is refused at the door and by the gate", () => {
  beforeEach(() => {
    store.generator = { generator: "jarvis", at: NOW, reason: "" };
  });

  const cases: Array<[string, Record<string, unknown>, string]> = [
    ["a </script> title", { title: "Queues</script><script>alert(1)</script>" }, "title"],
    ["a <script> excerpt", { excerpt: "Read this <script src=//x.example></script> now" }, "excerpt"],
    ["a </script> FAQ question", { faqs: [{ question: "Why </script><script>x()</script>?", answer: SENTENCE }] }, "faqs.0.question"],
    ["an event handler in an FAQ answer", { faqs: [{ question: "Why?", answer: `<img src=x onerror="x()"> ${SENTENCE}` }] }, "faqs.0.answer"],
    ["a javascript: link in the title", { title: "[Click](javascript:alert(1))" }, "title"],
    ["a javascript: href in the excerpt", { excerpt: 'See <a href="javascript:alert(1)">this</a> now' }, "excerpt"],
  ];
  for (const [name, over, path] of cases) {
    it(`refuses ${name} with 400`, async () => {
      const r = await intake(intakeBody(over));
      assert.equal(r.status, 400);
      assert.ok(r.json.error.details.issues.some((i: { path: string }) => i.path === path), JSON.stringify(r.json));
      assert.equal(store.blogs.size, 0);
    });
  }

  it("the drafts gate refuses to schedule a stored draft with a script tag in its title or FAQ", async () => {
    store.blogs.set("blog1", blog({ title: "Queues</script><script>x()</script>", faqs: [{ question: "<script>", answer: SENTENCE }] }));
    const r = await act("blog", "blog1", { action: "approve" });
    assert.equal(r.status, 422);
    assert.ok(r.json.error.details.reasons.includes("Unsafe markup in title"));
    assert.ok(r.json.error.details.reasons.includes("Unsafe markup in FAQ 1 question"));
  });
});

describe("intake: races under the lock", () => {
  beforeEach(() => {
    store.generator = { generator: "jarvis", at: NOW, reason: "" };
  });

  it("a switch back to site before the locked write is refused and stores nothing", async () => {
    store.generatorFlipsInWrite = true;
    const r = await intake(intakeBody({ approve: true }));
    assert.equal(r.status, 409);
    assert.equal(r.json.error.code, "generator_mismatch");
    assert.equal(store.blogs.size, 0);
  });

  const twin = (body: Record<string, unknown>, blogId: string): IntakeRecord => ({
    key: String(body.idempotencyKey),
    payloadHash: intakePayloadHash(intakeSchema.parse(body)),
    blogPostId: blogId,
    socialPostId: null,
    gates: { approveRequested: false },
    createdAt: NOW,
  });

  it("a duplicate slug that is this submission's own twin (pre-check) is replayed, not refused", async () => {
    const body = intakeBody();
    store.blogs.set("twin-blog", blog({ id: "twin-blog", slug: String(body.slug), title: "Twin" }));
    store.pendingIntake = twin(body, "twin-blog");
    const r = await intake(body);
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.intake.replayed, true);
    assert.equal(r.json.blog.id, "twin-blog");
    assert.ok(!store.logs.some((l) => l.status === "warn"), "no refusal logged");
  });

  it("a duplicate reported by the locked write whose key is now recorded is replayed too", async () => {
    const body = intakeBody();
    store.blogs.set("twin-blog", blog({ id: "twin-blog", slug: "other-slug", title: "Twin" }));
    store.twinOnWrite = twin(body, "twin-blog");
    const r = await intake(body);
    assert.equal(r.status, 200);
    assert.equal(r.json.blog.id, "twin-blog");
  });

  it("a next-slot time is redrawn under the lock when another blog took that slot meanwhile", async () => {
    // The pre-check saw nothing scheduled; under the lock a blog sits at the drawn time.
    store.blogs.set("other", blog({ id: "other", slug: "other", title: "Other", reviewState: "approved", publishAt: DRAWN_BLOG_AT }));
    const r = await intake(intakeBody({ approve: true, linkedin: { body: LI_BODY, criticScore: 84 } }));
    assert.equal(r.status, 201);
    const expected = drawBlog(new Date(DRAWN_BLOG_AT.getTime() + 5 * HOUR));
    assert.equal(r.json.blog.publishAt, expected.toISOString());
    assert.equal(r.json.social.scheduledFor, drawLi(expected).toISOString(), "LinkedIn redrawn after the blog");
    assert.equal(store.blogs.get(r.json.blog.id)?.publishAt?.getTime(), expected.getTime());
  });

  it("an explicit time inside the minimum gap of another scheduled blog is refused with 400", async () => {
    const at = new Date(NOW.getTime() + 30 * HOUR);
    store.blogs.set("other", blog({ id: "other", slug: "other", title: "Other", reviewState: "approved", publishAt: new Date(at.getTime() + 2 * HOUR) }));
    const r = await intake(intakeBody({ approve: true, publishAt: at.toISOString() }));
    assert.equal(r.status, 400);
    assert.equal(r.json.error.details.field, "publishAt");
    assert.equal(r.json.error.details.minGapHours, 5);
    assert.equal(store.intakes.size, 0);
  });

  it("refuses past the daily cap (PIPELINE_MAX_PER_DAY)", async () => {
    for (let i = 0; i < 5; i++) {
      const r = await intake(intakeBody({ idempotencyKey: `jv-content-cap-${i}`, slug: `cap-post-${i}`, title: `Cap post number ${i} about queues` }));
      assert.equal(r.status, 201, JSON.stringify(r.json));
    }
    const over = await intake(intakeBody({ idempotencyKey: "jv-content-cap-5", slug: "cap-post-5", title: "Cap post number 5 about queues" }));
    assert.equal(over.status, 409);
    assert.equal(over.json.error.code, "daily_cap");
    assert.deepEqual(over.json.error.details, { cap: 5, accepted: 5 });
  });

  it("re-checks an explicit publishAt after the link checks, which take time", async () => {
    const at = new Date(NOW.getTime() + 90_000);
    store.duringLinkCheck = () => {
      clockNow = new Date(NOW.getTime() + 60_000);
    };
    const r = await intake(intakeBody({ approve: true, publishAt: at.toISOString() }));
    assert.equal(r.status, 400);
    assert.equal(r.json.error.details.field, "publishAt");
    assert.equal(store.blogs.size, 0);
  });
});

describe("intake: daily cap counts the site's own posts too", () => {
  it("on the flip day a post the site's cron already wrote counts: intake is refused with daily_cap", async () => {
    store.generator = { generator: "jarvis", at: NOW, reason: "" };
    store.pipelineBlogsToday = 4; // written today by the site's cron before the switch
    assert.equal((await intake(intakeBody())).status, 201, "the fifth post of the day goes in");
    const over = await intake(intakeBody({ idempotencyKey: "jv-content-flipday", slug: "flip-day", title: "A flip day post about queue retries" }));
    assert.equal(over.status, 409);
    assert.equal(over.json.error.code, "daily_cap");
    assert.deepEqual(over.json.error.details, { cap: 5, accepted: 5 });
  });
});
