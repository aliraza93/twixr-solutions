import type { DuplicateCheckResult } from "@/lib/pipeline/manual/duplicate-check";
import type { Generator, GeneratorControl } from "@/lib/jarvis/generator";
import type { PipelineControl } from "@/lib/jarvis/pause";
import type { BlogState, SocialState } from "@/lib/jarvis/states";

/**
 * Everything the control API reads or writes, behind one interface so the
 * use cases can be tested without a database. The Prisma implementation in
 * prisma-store.ts reads and writes the pipeline's own tables only.
 */

export type Page<T> = { items: T[]; nextCursor: string | null };
export type PageArgs = { cursor?: string; limit: number };

export type ControlLog = {
  refType: "BlogPost" | "SocialPost" | "Brief" | "Pipeline" | "PipelineBacklog" | "PipelineGenerator" | "Intake";
  refId: string;
  status: "ok" | "warn";
  message: string;
  meta: Record<string, unknown>;
};

export type BriefRow = {
  id: string;
  pillar: string;
  topic: string;
  targetKeyword: string;
  angle: string;
  requiresLiveSource: boolean;
  status: string;
  scheduledFor: Date | null;
  usedAt: Date | null;
  origin: string;
  sourceUrl: string;
  createdAt: Date;
};

export type NewBrief = {
  pillar: string;
  topic: string;
  targetKeyword: string;
  angle: string;
  requiresLiveSource: boolean;
  scheduledFor: Date | null;
  sourceUrl: string;
  extraInstructions: string;
};

export type SocialSummary = {
  id: string;
  channel: string;
  status: string;
  reviewReasons: unknown;
  criticScore: number | null;
  scheduledFor: Date;
  publishedAt: Date | null;
};

export type BlogRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  origin: string;
  published: boolean;
  reviewState: string;
  reviewReasons: unknown;
  criticScore: number | null;
  publishAt: Date | null;
  briefId: string | null;
  createdAt: Date;
  updatedAt: Date;
  social: SocialSummary[];
};

export type BlogDetail = BlogRow & {
  body: string;
  image: string;
  tags: string[];
  faqs: unknown;
  brief: { requiresLiveSource: boolean } | null;
};

export type SocialRow = SocialSummary & {
  body: string;
  blogPostId: string | null;
  failReason: string;
  createdAt: Date;
};

export type SocialDetail = SocialRow & {
  blog: { published: boolean; reviewState: string; publishAt: Date | null } | null;
};

export type LogRow = {
  id: string;
  runId: string;
  stage: string;
  status: string;
  refType: string;
  refId: string;
  message: string;
  meta: unknown;
  createdAt: Date;
};

export type RunSummary = {
  runId: string;
  startedAt: Date;
  endedAt: Date;
  status: "ok" | "warn" | "fail" | "skip";
  stages: string[];
  lastMessage: string;
};

export type DayPlanRow = {
  day: string;
  go: boolean;
  slots: number;
  generatedCount: number;
  generateAt: Date | null;
  secondAt: Date | null;
  reason: string;
};

export type BlogUpdate = {
  reviewState: "approved" | "needs_review";
  reviewReasons: string[];
  publishAt: Date | null;
};

export type SocialUpdate = {
  status: "scheduled" | "needs_review";
  reviewReasons: string[];
  scheduledFor: Date;
};

/** What an accepted intake recorded under its idempotency key. */
export type IntakeRecord = {
  key: string;
  payloadHash: string;
  blogPostId: string;
  socialPostId: string | null;
  gates: unknown;
  createdAt: Date;
};

export type IntakeMatch = { kind: "slug" | "title"; id: string; slug: string; title: string };

export type NewIntakeBlog = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  tags: string[];
  readingTime: string;
  body: string;
  faqs: Array<{ question: string; answer: string }>;
  reviewState: "approved" | "needs_review";
  reviewReasons: string[];
  criticScore: number;
  publishAt: Date | null;
  contentCluster: string;
  targetKeyword: string;
  date: string;
};

export type NewIntakeSocial = {
  body: string;
  imageUrl: string;
  status: "scheduled" | "needs_review";
  reviewReasons: string[];
  criticScore: number | null;
  scheduledFor: Date;
};

export type NewIntake = {
  key: string;
  payloadHash: string;
  blog: NewIntakeBlog;
  social: NewIntakeSocial | null;
  /** Re-checked under the lock, against what other writers committed meanwhile. */
  limits: {
    /** Accepted intakes since this time (UTC day start) may not reach maxPerDay. */
    dayStart: Date;
    maxPerDay: number;
    /** A scheduled blog keeps at least this far from every other scheduled blog. */
    minGapMs: number;
    now: Date;
    /**
     * Set for a next-slot time: redraws the blog (and its LinkedIn post)
     * after the latest scheduled blog. Unset for an explicit time, which is
     * refused instead of moved.
     */
    redraw?: (latestScheduled: Date | null) => { publishAt: Date; scheduledFor: Date | null };
  };
  /** Written with the new ids filled in, in the same transaction. */
  log: { message: string; meta: Record<string, unknown> };
};

export type CreateIntakeResult =
  | { ok: true; blogPostId: string; socialPostId: string | null; publishAt: Date | null; scheduledFor: Date | null }
  | { ok: false; reason: "replay"; record: IntakeRecord }
  | { ok: false; reason: "generator"; generator: Generator }
  | { ok: false; reason: "daily_cap"; accepted: number }
  | { ok: false; reason: "gap"; near: Date }
  | { ok: false; reason: "duplicate"; matches: IntakeMatch[] }
  | { ok: false; reason: "conflict" };

export interface ControlStore {
  pipelineControl(): Promise<PipelineControl | null>;
  generatorControl(): Promise<GeneratorControl | null>;
  recentRuns(limit: number, since: Date): Promise<RunSummary[]>;
  dayPlan(day: string): Promise<DayPlanRow | null>;
  nextBlogPublishAt(): Promise<Date | null>;
  nextLinkedInAt(): Promise<Date | null>;
  queuedBriefCount(): Promise<number>;

  listBriefs(args: PageArgs & { status?: string; origin?: string }): Promise<Page<BriefRow>>;
  listBlogs(args: PageArgs & { state?: string }): Promise<Page<BlogRow>>;
  listSocial(args: PageArgs & { state?: string }): Promise<Page<SocialRow>>;
  listLogs(
    args: PageArgs & { runId?: string; refId?: string; stage?: string; status?: string }
  ): Promise<Page<LogRow>>;

  getBlog(id: string): Promise<BlogDetail | null>;
  getSocial(id: string): Promise<SocialDetail | null>;

  findQueuedBriefByTopic(topic: string): Promise<{ id: string } | null>;
  duplicateCheck(input: {
    topic: string;
    angle: string;
    pillar: string;
  }): Promise<DuplicateCheckResult>;
  internalAllowlist(): Promise<Set<string>>;

  /**
   * Past-due approved blogs (with every scheduled LinkedIn post of each,
   * whatever its time) and past-due LinkedIn posts, oldest first, capped at
   * RESUME_BATCH; `more` says the cap cut the list.
   */
  pastDue(now: Date): Promise<PastDue>;

  /**
   * Each write and its log row commit together, or neither does. Writes run
   * at the default isolation under row locks (SELECT ... FOR UPDATE on the
   * blog row, then its LinkedIn rows) or an advisory lock, with a 10 second
   * transaction timeout; a lock conflict or timeout reports as a conflict.
   */
  createBrief(
    data: NewBrief,
    log: Omit<ControlLog, "refId">
  ): Promise<{ ok: true; brief: BriefRow } | { ok: false; reason: "duplicate"; id: string } | { ok: false; reason: "conflict" }>;
  /**
   * Conditional on the row and its links still matching `guard` (and
   * `guard.expect`, checked under the lock); false means it moved.
   */
  updateBlog(id: string, guard: BlogGuard, data: BlogUpdate, log: ControlLog): Promise<boolean>;
  updateSocial(id: string, guard: SocialGuard, data: SocialUpdate, log: ControlLog): Promise<boolean>;
  /**
   * If the switch is still in `expectPaused`: move the listed rows that still
   * hold their `from` time (each blog together with its LinkedIn posts, the
   * blog only if none of them stays before its new time), then flip the
   * switch when `flip` is set. One transaction.
   */
  setPipelineControl(input: {
    expectPaused: boolean;
    flip: boolean;
    log: ControlLog;
    reschedule: Reschedule;
  }): Promise<{ ok: boolean; applied: Reschedule }>;
  /**
   * If the generator is still `expect`: write the control row that makes it
   * `to`. Advisory lock, re-read, write; one transaction.
   */
  setGenerator(input: { expect: Generator; log: ControlLog }): Promise<{ ok: boolean }>;

  /** The accepted intake recorded under this key, if any. */
  findIntake(key: string): Promise<IntakeRecord | null>;
  /** Blogs with this slug, or this title (any case). */
  findBlogMatches(input: { slug: string; title: string }): Promise<IntakeMatch[]>;
  /** Latest future publishAt among approved pipeline blogs, so a next-slot draw queues after it. */
  latestScheduledBlogAt(now: Date): Promise<Date | null>;
  /**
   * One transaction under the generator lock, then the intake lock: re-check
   * the generator (must be jarvis), the key (replay), the slug and the title
   * (duplicate), the daily cap and, for a scheduled blog, the minimum gap
   * (redraw a next-slot time, refuse an explicit one), then insert the blog,
   * its LinkedIn post and their log rows, and the Intake row for the key.
   */
  createIntake(data: NewIntake): Promise<CreateIntakeResult>;

  writeLog(log: ControlLog): Promise<void>;
}

/** Per resume call; the rest waits for the next call (keeps a run inside the transaction timeout). */
export const RESUME_BATCH = { blogs: 10, social: 25 };

export type PastDue = {
  blogs: Array<{
    id: string;
    slug: string;
    publishAt: Date;
    /** Every scheduled LinkedIn post of this blog, whatever its time. */
    social: Array<{ id: string; scheduledFor: Date }>;
  }>;
  social: Array<{
    id: string;
    scheduledFor: Date;
    blogPostId: string | null;
    blogPublished: boolean;
    blogPublishAt: Date | null;
  }>;
  /** Latest future publishAt among approved blogs, so the backlog queues after it. */
  lastScheduledBlogAt: Date | null;
  /** Past-due blogs left alone because a LinkedIn post of theirs is publishing right now. */
  held: string[];
  more: boolean;
};

/** A time move; a LinkedIn move made for a moved blog carries its blogId. */
export type Move = { id: string; from: Date; to: Date; blogId?: string };
export type Reschedule = { blogs: Move[]; social: Move[] };

export type BlogGuard = {
  updatedAt: Date;
  /** Jarvis's conditional write: re-checked after the row lock, before the update. */
  expect?: { state: BlogState; updatedAt: Date };
  /**
   * Moving to scheduled: no LinkedIn post of this blog may be scheduled
   * before `noneScheduledBefore`. Pausing: none may be scheduled at all.
   */
  social: { noneScheduledBefore: Date } | { noneScheduled: true };
};

export type SocialGuard = {
  status: string;
  scheduledFor: Date;
  /** Moving to scheduled: the linked blog must be published or approved to go live by this time. */
  blogLiveBy?: Date;
  /** Jarvis's conditional write: re-checked after the row lock, before the update. */
  expect?: { state: SocialState; scheduledFor: Date };
};
