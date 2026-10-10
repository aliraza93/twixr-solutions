import { pipeline } from "@/lib/pipeline/config";
import type { Rng } from "@/lib/pipeline/variety/rng";
import { pickWeighted } from "@/lib/pipeline/variety/sampler";

/**
 * Human-shaped publish times.
 *
 * The old code drew a flat 1 to 36 hour offset, which spreads posts across the
 * clock uniformly - including 04:00 local, which no human posts at. Worse, the
 * two daily cron windows flushed everything at 03:00 and 15:00 UTC anyway, so
 * the real timestamps had two values. This module draws an hour from a weighted
 * distribution in the author's timezone, with a thin off-peak tail.
 */

/** Relative weight per local hour, 0 to 23. Zero means never. */
type HourWeights = Record<number, number>;

/** Blog goes live across the working day and the evening. */
const BLOG_HOURS: HourWeights = {
  6: 1, 7: 3, 8: 5, 9: 8, 10: 9, 11: 8, 12: 5, 13: 4,
  14: 5, 15: 6, 16: 6, 17: 5, 18: 4, 19: 4, 20: 6, 21: 6,
  22: 4, 23: 2, 0: 0.4, 1: 0.2, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.4,
};

/** LinkedIn peaks before standups and again after work. */
const LINKEDIN_HOURS: HourWeights = {
  6: 0.5, 7: 2, 8: 5, 9: 10, 10: 10, 11: 7, 12: 3, 13: 2,
  14: 3, 15: 4, 16: 4, 17: 7, 18: 8, 19: 8, 20: 7, 21: 4,
  22: 2, 23: 0.6, 0: 0.2, 1: 0.1, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.2,
};

/** Mon 1 .. Sun 0, as Date.getUTCDay returns. */
export const WEEKDAY_WEIGHTS: Record<number, number> = {
  1: 1.0, // Mon
  2: 1.1, // Tue
  3: 1.1, // Wed
  4: 1.0, // Thu
  5: 0.8, // Fri
  6: 0.35, // Sat
  0: 0.5, // Sun
};

function timezone(): string {
  return pipeline.timezone;
}

/** Offset in minutes between UTC and the configured timezone at `at`. */
export function tzOffsetMinutes(at: Date, tz = timezone()): number {
  // Format the same instant in the target zone, read it back as if it were UTC,
  // and the difference is the offset. Handles DST without a date library.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** Local wall-clock hour at `at` in the configured timezone. */
export function localHour(at: Date, tz = timezone()): number {
  const shifted = new Date(at.getTime() + tzOffsetMinutes(at, tz) * 60000);
  return shifted.getUTCHours();
}

/** Local weekday at `at` (0 Sun .. 6 Sat). */
export function localWeekday(at: Date, tz = timezone()): number {
  const shifted = new Date(at.getTime() + tzOffsetMinutes(at, tz) * 60000);
  return shifted.getUTCDay();
}

function weightsFor(kind: "blog" | "linkedin"): HourWeights {
  return kind === "blog" ? BLOG_HOURS : LINKEDIN_HOURS;
}

export function drawLocalHour(rng: Rng, kind: "blog" | "linkedin"): number {
  const weights = weightsFor(kind);
  return pickWeighted(
    rng,
    Object.entries(weights).map(([hour, weight]) => ({
      value: Number(hour),
      weight,
    }))
  );
}

/**
 * Build a UTC Date for the next occurrence of a drawn local hour, at least
 * `minHoursAhead` from `from` and at most `maxDaysAhead` days out.
 */
export function drawPublishAt(
  rng: Rng,
  kind: "blog" | "linkedin",
  opts: { from?: Date; minHoursAhead?: number; maxDaysAhead?: number } = {}
): { at: Date; localHour: number; dayOffset: number } {
  const from = opts.from ?? new Date();
  const minHoursAhead = opts.minHoursAhead ?? 1;
  const maxDaysAhead = opts.maxDaysAhead ?? 2;
  const earliest = new Date(from.getTime() + minHoursAhead * 3600_000);

  const hour = drawLocalHour(rng, kind);
  const minute = rng.int(0, 59);

  for (let dayOffset = 0; dayOffset <= maxDaysAhead; dayOffset += 1) {
    const candidate = atLocalTime(from, dayOffset, hour, minute);
    if (candidate.getTime() >= earliest.getTime()) {
      // Weekday weighting: sometimes push a Saturday slot to the next day.
      const weekdayWeight = WEEKDAY_WEIGHTS[localWeekday(candidate)] ?? 1;
      if (weekdayWeight >= 1 || rng.float() < weekdayWeight) {
        return { at: candidate, localHour: hour, dayOffset };
      }
    }
  }

  const fallback = atLocalTime(from, maxDaysAhead, hour, minute);
  return {
    at: fallback.getTime() >= earliest.getTime() ? fallback : earliest,
    localHour: hour,
    dayOffset: maxDaysAhead,
  };
}

/** The instant at local `hour:minute`, `dayOffset` days after `from`'s local date. */
export function atLocalTime(
  from: Date,
  dayOffset: number,
  hour: number,
  minute: number,
  tz = timezone()
): Date {
  const offset = tzOffsetMinutes(from, tz);
  const localNow = new Date(from.getTime() + offset * 60000);
  const target = Date.UTC(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth(),
    localNow.getUTCDate() + dayOffset,
    hour,
    minute,
    rngSafeSecond(minute)
  );
  // Re-resolve the offset at the target instant so a DST change is handled.
  const approx = new Date(target - offset * 60000);
  const finalOffset = tzOffsetMinutes(approx, tz);
  return new Date(target - finalOffset * 60000);
}

/** Seconds derived from minutes so timestamps are not all :00. */
function rngSafeSecond(minute: number): number {
  return (minute * 37) % 60;
}

/** Which hour bucket an instant falls in, for the variety audit. */
export function hourBucket(at: Date): string {
  const h = localHour(at);
  if (h < 6) return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "late";
}
