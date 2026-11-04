import type { DuplicateCheckResult } from "@/lib/pipeline/manual/duplicate-check";
import type { PipelineControl } from "@/lib/jarvis/pause";

/**
 * Everything the control API reads or writes, behind one interface so the
 * use cases can be tested without a database. The Prisma implementation in
 * prisma-store.ts reads and writes the pipeline's own tables only.
 */

export type Page<T> = { items: T[]; nextCursor: string | null };
export type PageArgs = { cursor?: string; limit: number };

export type ControlLog = {
  refType: "BlogPost" | "SocialPost" | "Brief" | "Pipeline";
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

export interface ControlStore {
  pipelineControl(): Promise<PipelineControl | null>;
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

  /** Past-due approved blogs and scheduled LinkedIn posts, oldest first. */
  pastDue(now: Date): Promise<PastDue>;

  /**
   * Each write and its log row commit together, or neither does. Writes run
   * at Serializable isolation; a serialization failure reports as a conflict.
   */
  createBrief(
    data: NewBrief,
    log: Omit<ControlLog, "refId">
  ): Promise<{ ok: true; brief: BriefRow } | { ok: false; reason: "duplicate"; id: string } | { ok: false; reason: "conflict" }>;
  /** Conditional on the row and its links still matching `guard`; false means it moved. */
  updateBlog(id: string, guard: BlogGuard, data: BlogUpdate, log: ControlLog): Promise<boolean>;
  updateSocial(id: string, guard: SocialGuard, data: SocialUpdate, log: ControlLog): Promise<boolean>;
  /**
   * Flip the pipeline switch if it is still in `expectPaused`, moving any
   * listed past-due rows that still hold their `from` time. One transaction.
   */
  setPipelineControl(input: {
    expectPaused: boolean;
    log: ControlLog;
    reschedule: Reschedule;
  }): Promise<{ ok: boolean; applied: Reschedule }>;
  writeLog(log: ControlLog): Promise<void>;
}

export type PastDue = {
  blogs: Array<{ id: string; slug: string; publishAt: Date }>;
  social: Array<{
    id: string;
    scheduledFor: Date;
    blogPostId: string | null;
    blogPublished: boolean;
    blogPublishAt: Date | null;
  }>;
  /** Latest future publishAt among approved blogs, so the backlog queues after it. */
  lastScheduledBlogAt: Date | null;
};

export type Move = { id: string; from: Date; to: Date };
export type Reschedule = { blogs: Move[]; social: Move[] };

export type BlogGuard = {
  updatedAt: Date;
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
};
