/**
 * Draft states as Jarvis sees them, derived from the pipeline's own columns
 * (BlogPost.published + reviewState, SocialPost.status). No new status column:
 * a paused draft is a needs_review draft whose first review reason is the
 * pause marker, so the admin review screen shows it too.
 *
 * Every Jarvis action goes through `transitionFor`; a move not in the table
 * is refused and changes nothing.
 */

export const PAUSE_MARKER = "Paused by Jarvis";

export const BLOG_STATES = [
  "published",
  "scheduled",
  "needs_review",
  "paused",
  "discarded",
] as const;
export type BlogState = (typeof BLOG_STATES)[number];

export const SOCIAL_STATES = [
  "published",
  "scheduled",
  "publishing",
  "needs_review",
  "paused",
  "manual",
  "failed",
] as const;
export type SocialState = (typeof SOCIAL_STATES)[number];

export const DRAFT_ACTIONS = ["approve", "schedule", "pause", "resume"] as const;
export type DraftAction = (typeof DRAFT_ACTIONS)[number];

type Target = "scheduled" | "paused";

const TRANSITIONS: Record<DraftAction, { from: ReadonlyArray<string>; to: Target }> = {
  approve: { from: ["needs_review", "paused"], to: "scheduled" },
  schedule: { from: ["needs_review", "paused", "scheduled"], to: "scheduled" },
  pause: { from: ["scheduled"], to: "paused" },
  resume: { from: ["paused"], to: "scheduled" },
};

export function isPausedReasons(reasons: unknown): boolean {
  return Array.isArray(reasons) && reasons[0] === PAUSE_MARKER;
}

export function blogStateOf(post: {
  published: boolean;
  reviewState: string;
  reviewReasons: unknown;
}): BlogState {
  if (post.published) return "published";
  if (post.reviewState === "approved") return "scheduled";
  if (post.reviewState === "none") return "discarded";
  return isPausedReasons(post.reviewReasons) ? "paused" : "needs_review";
}

export function socialStateOf(post: {
  status: string;
  reviewReasons: unknown;
}): SocialState {
  switch (post.status) {
    case "published":
    case "scheduled":
    case "publishing":
    case "manual":
    case "failed":
      return post.status;
    default:
      return isPausedReasons(post.reviewReasons) ? "paused" : "needs_review";
  }
}

export type TransitionResult =
  | { ok: true; to: Target }
  | { ok: false; allowedFrom: ReadonlyArray<string> };

export function transitionFor(
  action: DraftAction,
  state: BlogState | SocialState
): TransitionResult {
  const rule = TRANSITIONS[action];
  return rule.from.includes(state)
    ? { ok: true, to: rule.to }
    : { ok: false, allowedFrom: rule.from };
}

export function pausedReasons(reason?: string): string[] {
  return reason ? [PAUSE_MARKER, `reason: ${reason}`] : [PAUSE_MARKER];
}
