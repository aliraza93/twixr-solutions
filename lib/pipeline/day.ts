import { requireDb, withDb } from "@/lib/cms/db";
import { pipeline } from "@/lib/pipeline/config";
import { getWeekPlan, shouldGenerateToday, type CadenceDecision } from "@/lib/pipeline/schedule";
import { atLocalTime, drawLocalHour, tzOffsetMinutes } from "@/lib/pipeline/variety/clock";
import { createRng } from "@/lib/pipeline/variety/rng";

/**
 * The day's generation decision, made once.
 *
 * The publish tick runs every 10 minutes so scheduled posts go live near their
 * drawn time rather than at one of two daily cron windows. That means the
 * cadence roll cannot live in the tick: a "40 percent chance today" evaluated
 * 144 times would fire within the first hour, every day. So the roll happens
 * once per local day, is stored, and also draws the hour at which each of
 * today's runs may start - which is what makes generation itself land at a
 * varied time instead of always 03:00 UTC.
 *
 * A day can carry two slots, but only on a burst week, so the occasional
 * same-day double post is possible without becoming the pattern.
 */

export type DayPlan = {
  day: string;
  go: boolean;
  slots: number;
  generatedCount: number;
  generateAt: Date | null;
  secondAt: Date | null;
  /** When the first slot was claimed. Used to judge a stale claim. */
  generatedAt: Date | null;
  reason: string;
};

/** Local YYYY-MM-DD in the configured timezone. */
export function localDayKey(at = new Date()): string {
  const shifted = new Date(at.getTime() + tzOffsetMinutes(at) * 60000);
  return shifted.toISOString().slice(0, 10);
}

function rowToPlan(
  day: string,
  row: {
    go: boolean;
    slots: number;
    generatedCount: number;
    generateAt: Date | null;
    secondAt: Date | null;
    generatedAt: Date | null;
    reason: string;
  }
): DayPlan {
  return {
    day,
    go: row.go,
    slots: row.slots,
    generatedCount: row.generatedCount,
    generateAt: row.generateAt,
    secondAt: row.secondAt,
    generatedAt: row.generatedAt,
    reason: row.reason,
  };
}

export async function getDayPlan(at = new Date()): Promise<DayPlan> {
  const day = localDayKey(at);

  const existing = await withDb(async () => {
    const db = requireDb();
    return db.pipelineDay.findUnique({ where: { day } });
  }, null);

  if (existing) return rowToPlan(day, existing);

  const rng = createRng(
    pipeline.varietySeed ? `${pipeline.varietySeed}:day:${day}` : undefined
  );
  const cadence: CadenceDecision = await shouldGenerateToday(false, rng);
  const week = await getWeekPlan(at);

  let slots = 1;
  let generateAt: Date | null = null;
  let secondAt: Date | null = null;

  if (cadence.go) {
    generateAt = drawSlot(at, rng, 0);

    // A second slot only on burst weeks, and only sometimes. The per-day cap
    // still applies on top of this.
    if (
      week.mode === "burst" &&
      pipeline.variety.maxPerDay >= 2 &&
      rng.bool(0.3)
    ) {
      const gap = rng.int(
        pipeline.variety.minGapHoursMin,
        Math.max(pipeline.variety.minGapHoursMin + 1, 10)
      );
      const candidate = new Date(generateAt.getTime() + gap * 3600_000);
      // Keep both slots inside the same local day, otherwise it is just
      // tomorrow's post arriving early.
      if (localDayKey(candidate) === day) {
        slots = 2;
        secondAt = candidate;
      }
    }
  }

  const created = await withDb(async () => {
    const db = requireDb();
    // Two ticks can race on the first call of the day; the unique index on
    // `day` makes the loser read the winner's row instead of double-planning.
    try {
      return await db.pipelineDay.create({
        data: {
          day,
          go: cadence.go,
          slots,
          generateAt,
          secondAt,
          reason: cadence.reason,
        },
      });
    } catch {
      return db.pipelineDay.findUnique({ where: { day } });
    }
  }, null);

  return created
    ? rowToPlan(day, created)
    : {
        day,
        go: cadence.go,
        slots,
        generatedCount: 0,
        generateAt,
        secondAt,
        generatedAt: null,
        reason: cadence.reason,
      };
}

/** Draw a start time for slot `index` within the local day. */
function drawSlot(
  at: Date,
  rng: ReturnType<typeof createRng>,
  index: number
): Date {
  const hour = drawLocalHour(rng, "blog");
  const minute = rng.int(0, 59);
  const candidate = atLocalTime(at, 0, hour, minute);
  // If the drawn hour has already passed today, start shortly after now so the
  // day is not silently lost.
  if (candidate.getTime() <= at.getTime()) {
    return new Date(at.getTime() + rng.int(index * 30, index * 30 + 45) * 60_000);
  }
  return candidate;
}

/** True when a slot is open and its drawn start time has arrived. */
export function dayPlanIsDue(plan: DayPlan, at = new Date()): boolean {
  if (!plan.go) return false;
  if (plan.generatedCount >= plan.slots) return false;

  const target = plan.generatedCount === 0 ? plan.generateAt : plan.secondAt;
  if (!target) return false;
  return target.getTime() <= at.getTime();
}

/**
 * Claim the next slot. Returns false when another tick already took it.
 *
 * The guard is on generatedCount so two overlapping ticks cannot both claim
 * the same slot, which would double-post.
 */
export async function claimDayPlan(
  day: string,
  expectedCount: number
): Promise<boolean> {
  return withDb(async () => {
    const db = requireDb();
    const result = await db.pipelineDay.updateMany({
      where: { day, generatedCount: expectedCount },
      data: {
        generatedCount: expectedCount + 1,
        ...(expectedCount === 0 ? { generatedAt: new Date() } : {}),
      },
    });
    return result.count === 1;
  }, false);
}

/**
 * Recover a slot that was claimed but never produced a post.
 *
 * Generation runs inside a serverless function with a hard time limit. If it
 * is killed mid-run (or throws past the release path), the slot stays claimed
 * and the day goes silent even though the cadence roll said to post. This
 * compares claimed slots against posts that actually exist for the day and
 * hands back the difference once the claim is clearly stale.
 */
export async function recoverStaleClaim(
  plan: DayPlan,
  at = new Date(),
  staleAfterMinutes = 25
): Promise<DayPlan> {
  if (plan.generatedCount === 0) return plan;

  const actual = await withDb(async () => {
    const db = requireDb();
    return db.blogPost.count({
      where: { origin: "pipeline", date: plan.day },
    });
  }, -1);

  // -1 means the count failed; never release on a failed read, because that
  // would risk a double post rather than a missed one.
  if (actual < 0 || actual >= plan.generatedCount) return plan;

  const claimedAt = plan.generatedAt;
  if (claimedAt && at.getTime() - claimedAt.getTime() < staleAfterMinutes * 60_000) {
    return plan;
  }

  const recovered = await withDb(async () => {
    const db = requireDb();
    const result = await db.pipelineDay.updateMany({
      where: { day: plan.day, generatedCount: plan.generatedCount },
      data: { generatedCount: actual },
    });
    return result.count === 1;
  }, false);

  return recovered ? { ...plan, generatedCount: actual } : plan;
}

/** Give a claimed slot back when the run produced nothing. */
export async function releaseDayPlan(
  day: string,
  claimedCount: number
): Promise<void> {
  await withDb(async () => {
    const db = requireDb();
    await db.pipelineDay.updateMany({
      where: { day, generatedCount: claimedCount },
      data: { generatedCount: Math.max(0, claimedCount - 1) },
    });
  }, undefined);
}
