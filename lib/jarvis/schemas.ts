import { z } from "zod";
import { GENERATORS } from "@/lib/jarvis/generator";
import { BLOG_STATES, DRAFT_ACTIONS, SOCIAL_STATES } from "@/lib/jarvis/states";
import { isAllowedPort, isPublicHost } from "@/lib/security/public-host";

/** Request shapes for /api/jarvis/*. Unknown body keys are refused. */

const rowId = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid id");

const slugLike = z
  .string()
  .max(32)
  .regex(/^[a-z][a-z-]*$/, "Invalid value");

const isoDateTime = z.iso.datetime({ offset: true });

export { isPublicHost };

const publicHttpUrl = z
  .url({ protocol: /^https?$/ })
  .max(2000)
  .refine((value) => {
    try {
      const url = new URL(value);
      return isAllowedPort(url.port) && isPublicHost(url.hostname);
    } catch {
      return false;
    }
  }, "Source must be a public http(s) URL");

/** Image URLs are served to readers, so https only. */
const publicHttpsUrl = publicHttpUrl.refine((value) => value.startsWith("https://"), "Must be an https URL");

const pillarField = z
  .string()
  .trim()
  .max(60)
  .regex(/^[A-Za-z][A-Za-z ]*(\/[A-Za-z][A-Za-z .]*)?$/, "Invalid pillar");

export const pageQuery = z.object({
  cursor: rowId.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const briefsQuery = pageQuery.extend({
  status: z.enum(["queued", "used", "skipped"]).optional(),
  origin: slugLike.optional(),
});

export const draftsQuery = pageQuery.extend({
  kind: z.enum(["blog", "social"]).default("blog"),
  state: z.enum([...new Set([...BLOG_STATES, ...SOCIAL_STATES])] as [string, ...string[]]).optional(),
});

export const logsQuery = pageQuery.extend({
  runId: z.string().max(64).regex(/^[A-Za-z0-9-]+$/, "Invalid runId").optional(),
  refId: rowId.optional(),
  stage: slugLike.optional(),
  status: z.enum(["ok", "warn", "fail", "skip"]).optional(),
});

export const draftParams = z.object({
  kind: z.enum(["blog", "social"]),
  id: rowId,
});

export const DESTINATIONS = ["blog", "linkedin", "x"] as const;

export const createBriefBody = z
  .object({
    kind: z.enum(["brief", "hot_topic"]).default("brief"),
    topic: z.string().trim().min(3).max(200),
    take: z.string().trim().max(400).default(""),
    pillar: pillarField.optional(),
    sources: z
      .array(publicHttpUrl)
      .max(5)
      .default([]),
    destinations: z.array(z.enum(DESTINATIONS)).min(1).max(3).default(["blog"]),
    scheduledFor: isoDateTime.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.kind === "hot_topic" && value.sources.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["sources"],
        message: "A hot topic needs at least one source URL",
      });
    }
    if (!value.destinations.includes("blog")) {
      ctx.addIssue({
        code: "custom",
        path: ["destinations"],
        message: "The site pipeline is blog-first: destinations must include blog",
      });
    }
    if (new Set(value.destinations).size !== value.destinations.length) {
      ctx.addIssue({ code: "custom", path: ["destinations"], message: "Duplicate destination" });
    }
  });

export type CreateBriefInput = z.infer<typeof createBriefBody>;

/**
 * Optional conditional write: the state (and blog updatedAt, or LinkedIn
 * scheduledFor) Jarvis saw when Ali approved. Checked inside the locked
 * transaction; a mismatch is 409 conflict with the current values.
 */
export const blogExpect = z
  .object({ state: z.enum(BLOG_STATES), updatedAt: isoDateTime })
  .strict();
export const socialExpect = z
  .object({ state: z.enum(SOCIAL_STATES), scheduledFor: isoDateTime })
  .strict();

const draftActionFields = {
  action: z.enum(DRAFT_ACTIONS),
  at: isoDateTime.optional(),
  reason: z.string().trim().min(1).max(280).optional(),
  /**
   * Passes findings the gate cannot re-check (dead links, duplicates, a
   * critic score under CRITIC_MIN_SCORE). Jarvis sends it only for a draft
   * Ali approved himself, never under an autopilot policy.
   */
  override: z.boolean().optional(),
};

function refineDraftAction(
  value: { action: string; at?: string; override?: boolean },
  ctx: z.RefinementCtx
) {
  if (value.override && value.action === "pause") {
    ctx.addIssue({ code: "custom", path: ["override"], message: "pause takes no override" });
  }
  if (value.action === "schedule" && !value.at) {
    ctx.addIssue({ code: "custom", path: ["at"], message: "schedule needs at" });
  }
  if ((value.action === "pause" || value.action === "resume") && value.at) {
    ctx.addIssue({ code: "custom", path: ["at"], message: `${value.action} takes no at` });
  }
}

/** Either kind's body; the route parses with draftActionBodyFor(kind). */
export const draftActionBody = z
  .object({ ...draftActionFields, expect: z.union([blogExpect, socialExpect]).optional() })
  .strict()
  .superRefine(refineDraftAction);

export const blogDraftActionBody = z
  .object({ ...draftActionFields, expect: blogExpect.optional() })
  .strict()
  .superRefine(refineDraftAction);

export const socialDraftActionBody = z
  .object({ ...draftActionFields, expect: socialExpect.optional() })
  .strict()
  .superRefine(refineDraftAction);

export function draftActionBodyFor(kind: "blog" | "social"): z.ZodType<DraftActionInput> {
  return kind === "blog" ? blogDraftActionBody : socialDraftActionBody;
}

export type DraftActionInput = z.infer<typeof draftActionBody>;

const reasonField = z.string().trim().min(1).max(280).optional();

export const pipelineActionBody = z.discriminatedUnion("action", [
  z.object({ action: z.enum(["pause", "resume"]), reason: reasonField }).strict(),
  z
    .object({ action: z.literal("set_generator"), generator: z.enum(GENERATORS), reason: reasonField })
    .strict(),
]);

export type PipelineActionInput = z.infer<typeof pipelineActionBody>;

/**
 * A finished blog from Jarvis's engine (POST /api/jarvis/intake). The site
 * re-runs all of its own gates; `approve` asks for scheduled, which the site
 * grants only when every gate passes. Jarvis sends `approve: true` only under
 * an approved Approval or an approved, unexpired autopilot policy (D-038).
 */
export const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;

const score = z.number().int().min(0).max(100);

export const intakeBody = z
  .object({
    idempotencyKey: z.string().regex(IDEMPOTENCY_KEY_RE, "8 to 64 letters, digits, - or _"),
    title: z.string().trim().min(1).max(200),
    excerpt: z.string().trim().min(1).max(400),
    /** Length and kebab-case are metadata hard fails, refused by the gate (422). */
    slug: z.string().trim().min(1).max(120),
    tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
    category: z.string().trim().max(60).default(""),
    body: z.string().trim().min(1).max(60_000),
    faqs: z
      .array(z.object({ question: z.string().trim().min(1).max(300), answer: z.string().trim().max(2000) }).strict())
      .max(20)
      .default([]),
    criticScore: score,
    sources: z.array(publicHttpUrl).max(20).default([]),
    requiresLiveSource: z.boolean().default(false),
    coverImageUrl: publicHttpsUrl.optional(),
    /** The brief topic, for the duplicate check; defaults to the title. */
    topic: z.string().trim().min(3).max(200).optional(),
    pillar: pillarField.optional(),
    targetKeyword: z.string().trim().max(120).default(""),
    linkedin: z
      .object({
        body: z.string().trim().min(1).max(3000),
        criticScore: score.optional(),
        imageUrl: publicHttpsUrl.optional(),
      })
      .strict()
      .optional(),
    publishAt: z.union([isoDateTime, z.literal("next_slot")]).default("next_slot"),
    approve: z.boolean().default(false),
  })
  .strict();

export type IntakeInput = z.infer<typeof intakeBody>;
