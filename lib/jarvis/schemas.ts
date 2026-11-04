import { z } from "zod";
import { BLOG_STATES, DRAFT_ACTIONS, SOCIAL_STATES } from "@/lib/jarvis/states";
import { isPublicHost } from "@/lib/security/public-host";

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
      return isPublicHost(new URL(value).hostname);
    } catch {
      return false;
    }
  }, "Source must be a public http(s) URL");

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
    pillar: z
      .string()
      .trim()
      .max(60)
      .regex(/^[A-Za-z][A-Za-z ]*(\/[A-Za-z][A-Za-z .]*)?$/, "Invalid pillar")
      .optional(),
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

export const pipelineActionBody = z
  .object({
    action: z.enum(["pause", "resume"]),
    reason: z.string().trim().min(1).max(280).optional(),
  })
  .strict();

export type PipelineActionInput = z.infer<typeof pipelineActionBody>;
