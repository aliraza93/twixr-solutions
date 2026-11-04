import { normalizeManualTopic } from "@/lib/pipeline/manual/normalize-topic";
import { ControlError } from "@/lib/jarvis/errors";
import { blogGate, socialGate, type GateResult } from "@/lib/jarvis/gates";
import { JARVIS_SOURCE, PIPELINE_REF_ID } from "@/lib/jarvis/pause";
import type {
  CreateBriefInput,
  DraftActionInput,
  PipelineActionInput,
} from "@/lib/jarvis/schemas";
import {
  BLOG_STATES,
  SOCIAL_STATES,
  blogStateOf,
  pausedReasons,
  socialStateOf,
  transitionFor,
  type DraftAction,
} from "@/lib/jarvis/states";
import type {
  BlogRow,
  BriefRow,
  ControlLog,
  ControlStore,
  LogRow,
  SocialRow,
  SocialSummary,
} from "@/lib/jarvis/store";

/**
 * Use cases behind /api/jarvis/*. Route handlers only parse, call one of
 * these and serialise. Nothing here publishes: approving or scheduling sets
 * the same fields the pipeline sets, and the site's own 10-minute tick does
 * the publishing, so there is still exactly one publisher.
 */

export type ControlConfig = {
  enabled: boolean;
  autoPublish: boolean;
  criticFloor: number;
  criticMinScore: number;
  timezone: string;
  crons: Array<{ path: string; schedule: string }>;
};

export type ControlDeps = {
  store: ControlStore;
  now: () => Date;
  config: ControlConfig;
  dayKey: (at: Date) => string;
  drawBlogPublishAt: (from: Date) => Date;
  drawLinkedInAt: (after: Date) => Date;
};

export const MIN_LEAD_MS = 60_000;
export const MAX_AHEAD_MS = 90 * 24 * 3600_000;
const RUN_WINDOW_MS = 14 * 24 * 3600_000;

function socialSummaryView(s: SocialSummary) {
  return {
    id: s.id,
    channel: s.channel,
    state: socialStateOf(s),
    criticScore: s.criticScore,
    scheduledFor: s.scheduledFor,
    publishedAt: s.publishedAt,
  };
}

function blogView(b: BlogRow) {
  return {
    kind: "blog" as const,
    id: b.id,
    slug: b.slug,
    title: b.title,
    excerpt: b.excerpt,
    state: blogStateOf(b),
    criticScore: b.criticScore,
    reviewReasons: Array.isArray(b.reviewReasons) ? b.reviewReasons : [],
    publishAt: b.publishAt,
    briefId: b.briefId,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    social: b.social.map(socialSummaryView),
  };
}

function socialView(s: SocialRow) {
  return {
    kind: "social" as const,
    id: s.id,
    channel: s.channel,
    state: socialStateOf(s),
    criticScore: s.criticScore,
    reviewReasons: Array.isArray(s.reviewReasons) ? s.reviewReasons : [],
    scheduledFor: s.scheduledFor,
    publishedAt: s.publishedAt,
    blogPostId: s.blogPostId,
    failReason: s.failReason,
    preview: s.body.slice(0, 280),
    createdAt: s.createdAt,
  };
}

function briefView(b: BriefRow) {
  return {
    id: b.id,
    pillar: b.pillar,
    topic: b.topic,
    take: b.angle,
    targetKeyword: b.targetKeyword,
    requiresLiveSource: b.requiresLiveSource,
    status: b.status,
    origin: b.origin,
    sourceUrl: b.sourceUrl,
    scheduledFor: b.scheduledFor,
    usedAt: b.usedAt,
    createdAt: b.createdAt,
  };
}

function logView(l: LogRow) {
  return {
    id: l.id,
    runId: l.runId,
    stage: l.stage,
    status: l.status,
    refType: l.refType,
    refId: l.refId,
    message: l.message,
    meta: l.meta,
    source: l.stage === "jarvis" ? "jarvis" : "pipeline",
    createdAt: l.createdAt,
  };
}

/** An explicit time must sit between one minute and 90 days from now. */
function checkWindow(at: Date, current: Date, field: string): Date {
  const delta = at.getTime() - current.getTime();
  if (delta < MIN_LEAD_MS || delta > MAX_AHEAD_MS) {
    throw new ControlError(
      400,
      "invalid_request",
      `${field} must be between 1 minute and 90 days from now`,
      { field }
    );
  }
  return at;
}

/** Explicit time, else the existing one if still ahead, else a fresh draw. */
function resolveTime(
  explicit: string | undefined,
  existing: Date | null,
  draw: () => Date,
  current: Date
): Date {
  if (explicit) return checkWindow(new Date(explicit), current, "at");
  if (existing && existing.getTime() - current.getTime() >= MIN_LEAD_MS) return existing;
  return draw();
}

function refuseTransition(kind: string, action: DraftAction, state: string, allowedFrom: ReadonlyArray<string>): never {
  throw new ControlError(409, "invalid_transition", `Cannot ${action} a ${state} ${kind} draft`, {
    state,
    allowedFrom,
  });
}

export function createControlService(deps: ControlDeps) {
  const { store, config } = deps;

  async function refuseGate(
    log: Omit<ControlLog, "status" | "message">,
    label: string,
    gate: GateResult
  ): Promise<never> {
    await store.writeLog({
      ...log,
      status: "warn",
      message: `Jarvis ${String(log.meta.action)} refused by quality gate: ${label}`,
      meta: { ...log.meta, reasons: gate.reasons },
    });
    throw new ControlError(422, "quality_gate", "The draft does not pass the site's quality gates", {
      reasons: gate.reasons,
    });
  }

  async function actOnBlog(id: string, input: DraftActionInput) {
    const post = await store.getBlog(id);
    if (!post || post.origin !== "pipeline") {
      throw new ControlError(404, "not_found", "No pipeline blog draft with that id");
    }
    const from = blogStateOf(post);
    const move = transitionFor(input.action, from);
    if (!move.ok) refuseTransition("blog", input.action, from, move.allowedFrom);

    const current = deps.now();
    const meta: Record<string, unknown> = {
      source: JARVIS_SOURCE,
      action: input.action,
      from,
      to: move.to,
      reason: input.reason ?? "",
    };
    const scheduledSocial = post.social.filter((s) => s.status === "scheduled");

    let data;
    let message: string;
    if (move.to === "scheduled") {
      const at = resolveTime(input.at, post.publishAt, () => deps.drawBlogPublishAt(current), current);
      const early = scheduledSocial.filter((s) => s.scheduledFor.getTime() < at.getTime());
      if (early.length) {
        throw new ControlError(
          409,
          "linked_social",
          "A LinkedIn post for this blog is scheduled before the new time; pause or reschedule it first",
          { socialPostIds: early.map((s) => s.id) }
        );
      }
      const gate = blogGate(post, post.brief, {
        criticFloor: config.criticFloor,
        internalAllowlist: await store.internalAllowlist(),
      });
      if (!gate.ok) await refuseGate({ refType: "BlogPost", refId: id, meta }, post.slug, gate);
      meta.publishAt = at.toISOString();
      data = { reviewState: "approved" as const, reviewReasons: [], publishAt: at };
      message = `Jarvis ${input.action} blog ${post.slug}: publishes at ${at.toISOString()}`;
    } else {
      if (scheduledSocial.length) {
        throw new ControlError(
          409,
          "linked_social",
          "This blog has scheduled LinkedIn post(s); pause them first so nothing links to an unpublished page",
          { socialPostIds: scheduledSocial.map((s) => s.id) }
        );
      }
      data = {
        reviewState: "needs_review" as const,
        reviewReasons: pausedReasons(input.reason),
        publishAt: post.publishAt,
      };
      message = `Jarvis paused blog ${post.slug}`;
    }

    const updated = await store.updateBlog(id, { updatedAt: post.updatedAt }, data, {
      refType: "BlogPost",
      refId: id,
      status: "ok",
      message,
      meta,
    });
    if (!updated) {
      throw new ControlError(409, "conflict", "The draft changed while this request ran; read it again");
    }
    const fresh = await store.getBlog(id);
    return { draft: fresh ? blogView(fresh) : null };
  }

  async function actOnSocial(id: string, input: DraftActionInput) {
    const post = await store.getSocial(id);
    if (!post) throw new ControlError(404, "not_found", "No social draft with that id");
    if (post.channel !== "linkedin") {
      throw new ControlError(409, "invalid_transition", `${post.channel} drafts are posted by hand, not scheduled`, {
        channel: post.channel,
      });
    }
    const from = socialStateOf(post);
    const move = transitionFor(input.action, from);
    if (!move.ok) refuseTransition("social", input.action, from, move.allowedFrom);

    const current = deps.now();
    const meta: Record<string, unknown> = {
      source: JARVIS_SOURCE,
      action: input.action,
      from,
      to: move.to,
      reason: input.reason ?? "",
    };

    let data;
    let message: string;
    if (move.to === "scheduled") {
      const blogAt = post.blog?.publishAt;
      const after = blogAt && blogAt.getTime() > current.getTime() ? blogAt : current;
      const at = resolveTime(input.at, post.scheduledFor, () => deps.drawLinkedInAt(after), current);
      const gate = await socialGate(post, post.blog, at, { criticFloor: config.criticFloor });
      if (!gate.ok) await refuseGate({ refType: "SocialPost", refId: id, meta }, id, gate);
      meta.scheduledFor = at.toISOString();
      data = { status: "scheduled" as const, reviewReasons: [], scheduledFor: at };
      message = `Jarvis ${input.action} LinkedIn post ${id}: posts at ${at.toISOString()}`;
    } else {
      data = {
        status: "needs_review" as const,
        reviewReasons: pausedReasons(input.reason),
        scheduledFor: post.scheduledFor,
      };
      message = `Jarvis paused LinkedIn post ${id}`;
    }

    const updated = await store.updateSocial(
      id,
      { status: post.status, scheduledFor: post.scheduledFor },
      data,
      { refType: "SocialPost", refId: id, status: "ok", message, meta }
    );
    if (!updated) {
      throw new ControlError(409, "conflict", "The draft changed while this request ran; read it again");
    }
    const fresh = await store.getSocial(id);
    return { draft: fresh ? socialView(fresh) : null };
  }

  return {
    async status() {
      const current = deps.now();
      const day = deps.dayKey(current);
      const [control, lastRuns, plan, blogPublishAt, linkedinAt, queuedBriefs] = await Promise.all([
        store.pipelineControl(),
        store.recentRuns(10, new Date(current.getTime() - RUN_WINDOW_MS)),
        store.dayPlan(day),
        store.nextBlogPublishAt(),
        store.nextLinkedInAt(),
        store.queuedBriefCount(),
      ]);
      const paused = control?.paused ?? false;
      const open = plan && plan.go && plan.generatedCount < plan.slots;
      return {
        pipeline: {
          enabled: config.enabled,
          paused,
          running: config.enabled && !paused,
          pausedAt: paused ? control?.at ?? null : null,
          pauseReason: paused ? control?.reason ?? "" : "",
          autoPublish: config.autoPublish,
          criticFloor: config.criticFloor,
          criticMinScore: config.criticMinScore,
          timezone: config.timezone,
        },
        cron: config.crons,
        today: plan ? { ...plan, planned: true } : { day, planned: false },
        next: {
          generateAt: open ? (plan.generatedCount === 0 ? plan.generateAt : plan.secondAt) : null,
          blogPublishAt,
          linkedinAt,
        },
        queue: { queuedBriefs },
        lastRuns,
      };
    },

    async listBriefs(q: { cursor?: string; limit: number; status?: string; origin?: string }) {
      const page = await store.listBriefs(q);
      return { items: page.items.map(briefView), nextCursor: page.nextCursor };
    },

    async listDrafts(q: { cursor?: string; limit: number; kind: "blog" | "social"; state?: string }) {
      const valid: ReadonlyArray<string> = q.kind === "blog" ? BLOG_STATES : SOCIAL_STATES;
      if (q.state && !valid.includes(q.state)) {
        throw new ControlError(400, "invalid_request", `state must be one of ${valid.join(", ")}`, {
          field: "state",
        });
      }
      if (q.kind === "blog") {
        const page = await store.listBlogs(q);
        return { items: page.items.map(blogView), nextCursor: page.nextCursor };
      }
      const page = await store.listSocial(q);
      return { items: page.items.map(socialView), nextCursor: page.nextCursor };
    },

    async getDraft(kind: "blog" | "social", id: string) {
      const logs = async () => (await store.listLogs({ refId: id, limit: 20 })).items.map(logView);
      if (kind === "blog") {
        const post = await store.getBlog(id);
        if (!post || post.origin !== "pipeline") {
          throw new ControlError(404, "not_found", "No pipeline blog draft with that id");
        }
        return {
          draft: { ...blogView(post), body: post.body, tags: post.tags, faqs: post.faqs },
          logs: await logs(),
        };
      }
      const post = await store.getSocial(id);
      if (!post) throw new ControlError(404, "not_found", "No social draft with that id");
      return { draft: { ...socialView(post), body: post.body }, logs: await logs() };
    },

    async listLogs(q: {
      cursor?: string;
      limit: number;
      runId?: string;
      refId?: string;
      stage?: string;
      status?: string;
    }) {
      const page = await store.listLogs(q);
      return { items: page.items.map(logView), nextCursor: page.nextCursor };
    },

    async createBrief(input: CreateBriefInput) {
      const current = deps.now();
      const hot = input.kind === "hot_topic";
      let normalized;
      try {
        normalized = normalizeManualTopic({
          topic: input.topic,
          angle: input.take,
          pillar: hot ? input.pillar ?? "Timely" : input.pillar,
          sourceUrl: input.sources[0] ?? "",
        });
      } catch (error) {
        throw new ControlError(400, "invalid_request", (error as Error).message, { field: "topic" });
      }
      const scheduledFor = input.scheduledFor
        ? checkWindow(new Date(input.scheduledFor), current, "scheduledFor")
        : null;

      const exact = await store.findQueuedBriefByTopic(normalized.topic);
      if (exact) {
        throw new ControlError(409, "duplicate", "A queued brief already has this topic", {
          matches: [{ kind: "brief", id: exact.id, title: normalized.topic, score: 1 }],
        });
      }
      const duplicate = await store.duplicateCheck({
        topic: normalized.topic,
        angle: normalized.angle,
        pillar: normalized.pillar,
      });
      if (duplicate.blocked) {
        throw new ControlError(409, "duplicate", duplicate.reason, {
          risk: duplicate.risk,
          matches: duplicate.matches,
        });
      }

      const extraSources = input.sources.slice(1);
      const brief = await store.createBrief(
        {
          pillar: normalized.pillar,
          topic: normalized.topic,
          targetKeyword: normalized.targetKeyword,
          angle: normalized.angle,
          requiresLiveSource: hot ? true : normalized.requiresLiveSource,
          scheduledFor,
          sourceUrl: normalized.sourceUrl,
          extraInstructions: extraSources.length
            ? `Also verify against these sources: ${extraSources.join(" ")}`
            : "",
        },
        {
          refType: "Brief",
          status: "ok",
          message: `Jarvis added ${hot ? "hot topic" : "brief"}: ${normalized.topic}`,
          meta: {
            source: JARVIS_SOURCE,
            action: "create_brief",
            kind: input.kind,
            destinations: input.destinations,
            sources: input.sources,
            duplicateRisk: duplicate.risk,
          },
        }
      );
      return {
        brief: briefView(brief),
        destinations: input.destinations,
        duplicateCheck: {
          risk: duplicate.risk,
          reason: duplicate.reason,
          matches: duplicate.matches,
        },
      };
    },

    async actOnDraft(kind: "blog" | "social", id: string, input: DraftActionInput) {
      return kind === "blog" ? actOnBlog(id, input) : actOnSocial(id, input);
    },

    async actOnPipeline(input: PipelineActionInput) {
      const control = await store.pipelineControl();
      const paused = control?.paused ?? false;
      if (input.action === "pause" && paused) {
        throw new ControlError(409, "invalid_transition", "The pipeline is already paused", { state: "paused" });
      }
      if (input.action === "resume" && !paused) {
        throw new ControlError(409, "invalid_transition", "The pipeline is not paused", { state: "running" });
      }
      const reason = input.reason ?? "";
      await store.writeLog({
        refType: "Pipeline",
        refId: PIPELINE_REF_ID,
        status: "ok",
        message: `Pipeline ${input.action === "pause" ? "paused" : "resumed"} from Jarvis${reason ? `: ${reason}` : ""}`,
        meta: { source: JARVIS_SOURCE, action: input.action, reason },
      });
      return {
        pipeline: {
          enabled: config.enabled,
          paused: input.action === "pause",
          running: config.enabled && input.action !== "pause",
          changedAt: deps.now(),
          reason,
        },
      };
    },
  };
}

export type ControlService = ReturnType<typeof createControlService>;
