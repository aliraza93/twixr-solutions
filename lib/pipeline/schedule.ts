import { randomInt } from "node:crypto";
import { requireDb, withDb } from "@/lib/cms/db";
import { pipeline } from "@/lib/pipeline/config";

/** Monday 00:00 UTC of the ISO week containing `d`. */
export function startOfUtcWeek(d = new Date()): Date {
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + mondayOffset)
  );
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function endOfUtcWeek(d = new Date()): Date {
  const start = startOfUtcWeek(d);
  return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
}

/**
 * Target posts this week (3 or 4 by default).
 * Deterministic per ISO week so Monday and Friday agree on the quota.
 */
export function targetPostsThisWeek(d = new Date()): number {
  const min = pipeline.postsPerWeekMin;
  const max = pipeline.postsPerWeekMax;
  if (max <= min) return min;
  const seed = startOfUtcWeek(d).toISOString().slice(0, 10);
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return min + (h % (max - min + 1));
}

export async function countPipelinePostsThisWeek(): Promise<number> {
  return withDb(async () => {
    const db = requireDb();
    const start = startOfUtcWeek();
    const end = endOfUtcWeek();
    return db.blogPost.count({
      where: {
        origin: "pipeline",
        createdAt: { gte: start, lt: end },
      },
    });
  }, 0);
}

/**
 * Probabilistic "post today?" so the week lands near 3-4 posts
 * without fixed Mon/Wed/Fri patterns.
 */
export async function shouldGenerateToday(force = false): Promise<{
  go: boolean;
  reason: string;
  postedThisWeek: number;
  target: number;
  daysLeftIncludingToday: number;
}> {
  if (force) {
    return {
      go: true,
      reason: "forced",
      postedThisWeek: 0,
      target: targetPostsThisWeek(),
      daysLeftIncludingToday: 1,
    };
  }

  const postedThisWeek = await countPipelinePostsThisWeek();
  const target = targetPostsThisWeek();
  const now = new Date();
  const day = now.getUTCDay(); // 0 Sun
  // Days remaining in week including today (Mon-Sun week ending Sunday UTC)
  const daysLeftIncludingToday = day === 0 ? 1 : 8 - day;

  if (postedThisWeek >= target) {
    return {
      go: false,
      reason: `Weekly quota already met (${postedThisWeek}/${target})`,
      postedThisWeek,
      target,
      daysLeftIncludingToday,
    };
  }

  const remaining = target - postedThisWeek;
  // Probability scales with how many slots left vs days left.
  const probability = Math.min(1, remaining / daysLeftIncludingToday);
  // Small jitter so we rarely post every remaining day in a row.
  const roll = randomInt(0, 10_000) / 10_000;
  const go = roll < probability;

  return {
    go,
    reason: go
      ? `Rolled ${(roll * 100).toFixed(1)}% < ${(probability * 100).toFixed(1)}% (need ${remaining} more this week)`
      : `Skipped today: rolled ${(roll * 100).toFixed(1)}% >= ${(probability * 100).toFixed(1)}% (need ${remaining} more, ${daysLeftIncludingToday} days left)`,
    postedThisWeek,
    target,
    daysLeftIncludingToday,
  };
}

/** Blog goes live at a random offset from now (hours), within configured window. */
export function randomBlogPublishAt(from = new Date()): Date {
  const minH = pipeline.blogPublishDelayMinHours;
  const maxH = pipeline.blogPublishDelayMaxHours;
  const hours = maxH <= minH ? minH : randomInt(minH, maxH + 1);
  const minutes = randomInt(0, 60);
  return new Date(from.getTime() + (hours * 60 + minutes) * 60 * 1000);
}

/** LinkedIn fires a random gap after the blog publish time. */
export function randomLinkedInScheduledFor(blogPublishAt: Date): Date {
  const minH = pipeline.linkedinDelayMinHours;
  const maxH = pipeline.linkedinDelayMaxHours;
  const hours = maxH <= minH ? minH : randomInt(minH, maxH + 1);
  const minutes = randomInt(0, 60);
  return new Date(blogPublishAt.getTime() + (hours * 60 + minutes) * 60 * 1000);
}
