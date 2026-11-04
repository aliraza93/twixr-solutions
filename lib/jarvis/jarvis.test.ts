import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { MIN_TOKEN_LENGTH, authorize, bearerToken, configuredToken } from "@/lib/jarvis/auth";
import { makeHandlers, RATE_LIMIT, type JarvisHandlers } from "@/lib/jarvis/handlers";
import { isPipelinePaused, type PipelineControl } from "@/lib/jarvis/pause";
import { SlidingWindowLimiter } from "@/lib/jarvis/rate-limit";
import { createControlService } from "@/lib/jarvis/service";
import { PAUSE_MARKER, blogStateOf, socialStateOf, transitionFor } from "@/lib/jarvis/states";
import type {
  BlogDetail,
  BriefRow,
  ControlLog,
  ControlStore,
  DayPlanRow,
  LogRow,
  SocialDetail,
} from "@/lib/jarvis/store";
import type { DuplicateCheckResult } from "@/lib/pipeline/manual/duplicate-check";

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

const TOKEN = "t".repeat(MIN_TOKEN_LENGTH + 8);
const NOW = new Date("2026-11-04T10:00:00.000Z");
const HOUR = 3600_000;
const DRAWN_BLOG_AT = new Date(NOW.getTime() + 20 * HOUR);
const DRAWN_LI_AT = new Date(NOW.getTime() + 30 * HOUR);
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

  private record(log: ControlLog) {
    this.logs.push({ ...log, id: `log${this.logs.length + 1}`, createdAt: NOW });
    if (log.refType === "Pipeline" && log.status === "ok") {
      this.control = { paused: log.meta.action === "pause", at: NOW, reason: String(log.meta.reason ?? "") };
    }
  }

  async pipelineControl() {
    return this.control;
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
    return row;
  }
  async updateBlog(id: string, guard: { updatedAt: Date }, data: Parameters<ControlStore["updateBlog"]>[2], log: ControlLog) {
    const b = this.blogs.get(id);
    if (this.raceNextUpdate || !b || b.published || b.updatedAt.getTime() !== guard.updatedAt.getTime()) return false;
    this.blogs.set(id, { ...b, ...data, updatedAt: new Date(b.updatedAt.getTime() + 1) });
    this.record(log);
    return true;
  }
  async updateSocial(id: string, guard: { status: string; scheduledFor: Date }, data: Parameters<ControlStore["updateSocial"]>[2], log: ControlLog) {
    const s = this.socials.get(id);
    if (!s || s.status !== guard.status || s.scheduledFor.getTime() !== guard.scheduledFor.getTime()) return false;
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
        now: () => NOW,
        config: {
          enabled: true,
          autoPublish: true,
          criticFloor: 60,
          criticMinScore: 78,
          timezone: "Asia/Karachi",
          crons: [{ path: "/api/cron/tick", schedule: "*/10 * * * *" }],
        },
        dayKey: () => "2026-11-04",
        drawBlogPublishAt: () => DRAWN_BLOG_AT,
        drawLinkedInAt: () => DRAWN_LI_AT,
      }),
  });
}

beforeEach(() => {
  store = new FakeStore();
  token = TOKEN;
  build();
});

function req(path: string, init: { method?: string; body?: unknown; auth?: string | null; ip?: string } = {}) {
  const headers = new Headers({ "x-forwarded-for": init.ip ?? "203.0.113.7" });
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

  it("the cron's pause check fails open without a database", async () => {
    assert.equal(await isPipelinePaused(), false);
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
