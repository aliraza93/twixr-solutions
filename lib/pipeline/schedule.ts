import { requireDb, withDb } from "@/lib/cms/db";
import { pipeline } from "@/lib/pipeline/config";
import { drawPublishAt, localWeekday, WEEKDAY_WEIGHTS } from "@/lib/pipeline/variety/clock";
import { createRng, type Rng } from "@/lib/pipeline/variety/rng";
import { pickWeighted, parseWeightEnv } from "@/lib/pipeline/variety/sampler";

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

export type WeekMode = "quiet" | "normal" | "burst";

export type WeekPlan = {
  weekStart: Date;
  mode: WeekMode;
  targetPosts: number;
  pillarWeights: Record<string, number>;
};

/**
 * Posts per week by mode. Kept low on purpose: a single-author site that
 * ships 3 to 6 AI-drafted posts a week reads as scaled content, and the
 * one post that ranks here is the one with first-hand depth.
 */
const MODE_TARGETS: Record<WeekMode, { min: number; max: number }> = {
  quiet: { min: 1, max: 1 },
  normal: { min: 1, max: 2 },
  burst: { min: 2, max: 2 },
};

/**
 * The week's cadence, drawn once and stored.
 *
 * The old version hashed the week start, which made the quota predictable and
 * limited it to two values. This draws a mode first, then a target inside that
 * mode, and perturbs the pillar weights so some weeks lean Build and others
 * lean Business. Stored in PipelineWeek so every run that week agrees.
 */
export async function getWeekPlan(d = new Date()): Promise<WeekPlan> {
  const weekStart = startOfUtcWeek(d);

  const existing = await withDb(async () => {
    const db = requireDb();
    return db.pipelineWeek.findUnique({ where: { weekStart } });
  }, null);

  if (existing) {
    return {
      weekStart,
      mode: existing.mode as WeekMode,
      targetPosts: existing.targetPosts,
      pillarWeights: (existing.pillarWeights ?? {}) as Record<string, number>,
    };
  }

  // Seed off the week so a replay of the same week reproduces it, but mix in
  // the configured seed so it is not derivable from the date alone.
  const rng = createRng(
    `${pipeline.varietySeed}:week:${weekStart.toISOString().slice(0, 10)}`
  );

  const mode = pickWeighted(
    rng,
    parseWeightEnv<WeekMode>(pipeline.variety.weekModes, {
      quiet: 12,
      normal: 72,
      burst: 16,
    })
  );
  const band = MODE_TARGETS[mode];
  const targetPosts = rng.int(band.min, band.max);
  const pillarWeights = perturbPillarWeights(rng);

  const created = await withDb(async () => {
    const db = requireDb();
    return db.pipelineWeek.create({
      data: { weekStart, mode, targetPosts, pillarWeights },
    });
  }, null);

  return {
    weekStart,
    mode: (created?.mode as WeekMode) ?? mode,
    targetPosts: created?.targetPosts ?? targetPosts,
    pillarWeights:
      ((created?.pillarWeights ?? pillarWeights) as Record<string, number>) ??
      pillarWeights,
  };
}

/** Plus or minus 25 percent on each pillar, so the week has a lean. */
function perturbPillarWeights(rng: Rng): Record<string, number> {
  const base = pipeline.pillarWeights;
  const jitter = () => 0.75 + rng.float() * 0.5;
  return {
    build: Math.round(base.build * jitter()),
    business: Math.round(base.business * jitter()),
    timely: Math.round(base.timely * jitter()),
    codeCard: Math.round(base.codeCard * jitter()),
  };
}

export async function targetPostsThisWeek(d = new Date()): Promise<number> {
  return (await getWeekPlan(d)).targetPosts;
}

export async function countPipelinePostsThisWeek(): Promise<number> {
  return withDb(async () => {
    const db = requireDb();
    const start = startOfUtcWeek();
    const end = endOfUtcWeek();
    return db.blogPost.count({
      where: { origin: "pipeline", createdAt: { gte: start, lt: end } },
    });
  }, 0);
}

type GapInfo = {
  /** Pipeline posts whose publishAt lands on today's local date. */
  publishedToday: number;
  /** Hours since the most recent pipeline post's publishAt (or Infinity). */
  hoursSinceLast: number;
};

async function gapInfo(): Promise<GapInfo> {
  return withDb(
    async () => {
      const db = requireDb();
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 3600_000);

      const recent = await db.blogPost.findMany({
        where: { origin: "pipeline" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { publishAt: true, createdAt: true },
      });

      const stamps = recent
        .map((r) => r.publishAt ?? r.createdAt)
        .filter((d): d is Date => Boolean(d))
        .sort((a, b) => b.getTime() - a.getTime());

      const last = stamps[0];
      return {
        publishedToday: stamps.filter((s) => s.getTime() >= dayAgo.getTime())
          .length,
        hoursSinceLast: last
          ? (now.getTime() - last.getTime()) / 3600_000
          : Number.POSITIVE_INFINITY,
      };
    },
    { publishedToday: 0, hoursSinceLast: Number.POSITIVE_INFINITY }
  );
}

export type CadenceDecision = {
  go: boolean;
  reason: string;
  postedThisWeek: number;
  target: number;
  mode: WeekMode;
  daysLeftIncludingToday: number;
};

/**
 * Should a post be generated right now?
 *
 * Replaces the old one-per-calendar-day guard with a randomized minimum gap, a
 * per-day cap, weekday weighting, and a hard anti-silence rule. The result is
 * bursts on some days and gaps on others instead of a metronome.
 */
export async function shouldGenerateToday(
  force = false,
  rng: Rng = createRng(pipeline.varietySeed || undefined)
): Promise<CadenceDecision> {
  const week = await getWeekPlan();

  if (force) {
    return {
      go: true,
      reason: "forced",
      postedThisWeek: 0,
      target: week.targetPosts,
      mode: week.mode,
      daysLeftIncludingToday: 1,
    };
  }

  const postedThisWeek = await countPipelinePostsThisWeek();
  const { publishedToday, hoursSinceLast } = await gapInfo();
  const now = new Date();
  const day = now.getUTCDay();
  const daysLeftIncludingToday = day === 0 ? 1 : 8 - day;

  const base = {
    postedThisWeek,
    target: week.targetPosts,
    mode: week.mode,
    daysLeftIncludingToday,
  };

  // Hard anti-silence rule: never let the blog go quiet for too long, whatever
  // the dice say. This is the quality floor, not a random dimension.
  if (hoursSinceLast > pipeline.variety.maxSilentDays * 24) {
    return {
      ...base,
      go: true,
      reason: `Anti-silence override: ${Math.round(hoursSinceLast / 24)} days since the last post`,
    };
  }

  if (publishedToday >= pipeline.variety.maxPerDay) {
    return {
      ...base,
      go: false,
      reason: `Daily cap reached (${publishedToday}/${pipeline.variety.maxPerDay} in the last 24h)`,
    };
  }

  // A second post the same day only on burst weeks, and only sometimes.
  if (publishedToday >= 1) {
    if (week.mode !== "burst" || !rng.bool(0.25)) {
      return {
        ...base,
        go: false,
        reason: `Already posted today (week mode: ${week.mode})`,
      };
    }
  }

  const minGap = rng.int(
    pipeline.variety.minGapHoursMin,
    pipeline.variety.minGapHoursMax
  );
  if (hoursSinceLast < minGap) {
    return {
      ...base,
      go: false,
      reason: `Inside the drawn minimum gap (${hoursSinceLast.toFixed(1)}h since last, needed ${minGap}h)`,
    };
  }

  if (postedThisWeek >= week.targetPosts) {
    return {
      ...base,
      go: false,
      reason: `Weekly quota met (${postedThisWeek}/${week.targetPosts}, ${week.mode} week)`,
    };
  }

  const remaining = week.targetPosts - postedThisWeek;
  const weekdayWeight = WEEKDAY_WEIGHTS[localWeekday(now)] ?? 1;
  const probability = Math.min(
    1,
    (remaining / daysLeftIncludingToday) * weekdayWeight
  );
  const roll = rng.float();
  const go = roll < probability;

  return {
    ...base,
    go,
    reason: go
      ? `Rolled ${(roll * 100).toFixed(1)}% < ${(probability * 100).toFixed(1)}% (need ${remaining} more, ${week.mode} week)`
      : `Skipped: rolled ${(roll * 100).toFixed(1)}% >= ${(probability * 100).toFixed(1)}% (need ${remaining} more, ${daysLeftIncludingToday} days left, weekday weight ${weekdayWeight})`,
  };
}

/**
 * Blog goes live at a drawn human hour in the author's timezone, between 1 and
 * ~2 days out, rather than a flat random offset that could land at 04:00.
 */
export function randomBlogPublishAt(
  from = new Date(),
  rng: Rng = createRng()
): Date {
  return drawPublishAt(rng, "blog", {
    from,
    minHoursAhead: 1,
    maxDaysAhead: 2,
  }).at;
}

/**
 * LinkedIn fires after the blog is live, at a drawn LinkedIn-peak hour.
 * Mixture: same day, next day, or two to three days later.
 */
export function randomLinkedInScheduledFor(
  blogPublishAt: Date,
  rng: Rng = createRng()
): Date {
  const spread = pickWeighted(rng, [
    { value: 0, weight: 45 },
    { value: 1, weight: 40 },
    { value: 2, weight: 10 },
    { value: 3, weight: 5 },
  ]);
  return drawPublishAt(rng, "linkedin", {
    from: blogPublishAt,
    minHoursAhead: spread === 0 ? 0.5 : 1,
    maxDaysAhead: spread + 1,
  }).at;
}
