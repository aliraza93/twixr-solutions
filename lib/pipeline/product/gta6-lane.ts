import type { Brief } from "@prisma/client";
import { GTA6_SHORTS } from "@/lib/pipeline/product/gta6shorts";
import { startOfDayKarachi, weekdayKarachi } from "@/lib/pipeline/product/week";
import { lastProductUse, nextProductBrief } from "@/lib/pipeline/product/weekly";

/**
 * GTA6 Shorts gets its own lane, separate from the daily editorial plan:
 * three posts a week, each a blog on this site plus a LinkedIn companion
 * (personal profile, and the GTA6 Shorts page when configured).
 *
 * Days are Karachi weekdays (0 = Sunday). Default Mon, Wed, Fri.
 */
export function gta6LaneEnabled(): boolean {
  return (process.env.PIPELINE_GTA6_LANE ?? "true").toLowerCase() !== "false";
}

export function gta6LaneDays(): number[] {
  const raw = process.env.PIPELINE_GTA6_DAYS ?? "1,3,5";
  const days = raw
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  return days.length ? [...new Set(days)] : [1, 3, 5];
}

/** Due on a lane day when nothing from the lane was used earlier that same Karachi day. */
export function isGta6PostDue(lastUsedAt: Date | null, now: Date, days = gta6LaneDays()): boolean {
  if (!days.includes(weekdayKarachi(now))) return false;
  if (!lastUsedAt) return true;
  return lastUsedAt.getTime() < startOfDayKarachi(now).getTime();
}

export type Gta6LaneDecision =
  | { due: false; reason: string }
  | { due: true; brief: Brief; launch: boolean };

export async function takeGta6BriefIfDue(
  now = new Date(),
  options: { force?: boolean } = {}
): Promise<Gta6LaneDecision> {
  if (!gta6LaneEnabled()) return { due: false, reason: "PIPELINE_GTA6_LANE is false" };
  const lastUsed = await lastProductUse(GTA6_SHORTS);
  // The very first run is the launch post: it goes out on any day, at once.
  const launch = lastUsed === null;
  if (!options.force && !launch && !isGta6PostDue(lastUsed, now)) {
    return { due: false, reason: "Not a GTA6 Shorts day, or today's post is done" };
  }
  const brief = await nextProductBrief(GTA6_SHORTS, now);
  if (!brief) return { due: false, reason: "GTA6 Shorts topic bank is used up" };
  return { due: true, brief, launch };
}
