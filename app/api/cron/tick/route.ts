import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/security/bearer";
import {
  claimDayPlan,
  dayPlanIsDue,
  getDayPlan,
  recoverStaleClaim,
  releaseDayPlan,
} from "@/lib/pipeline/day";
import { isPipelinePaused } from "@/lib/jarvis/pause";
import { generationSkipMessage, siteMayGenerate } from "@/lib/jarvis/generator";
import { runGenerate } from "@/lib/pipeline/run-generate";
import { runPublishDue } from "@/lib/pipeline/run-publish-due";
import { recoverStuckPublishing } from "@/lib/pipeline/run-publish-linkedin";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * The heartbeat. Runs every 10 minutes (Vercel Pro), which is what lets
 * scheduled blogs and LinkedIn posts go live near their drawn human-shaped
 * time instead of being flushed at one of two fixed daily cron windows.
 *
 * Cheap by default: two indexed queries find nothing due and it returns. The
 * expensive generate path only runs when the stored day plan says this is the
 * drawn moment, and the claim is atomic so overlapping ticks cannot double-post.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  // The tick fires every 10 minutes, so it does the cheap work only: flush
  // whatever is due. The weekly refresh and the variety audit run once a day
  // from /api/cron/generate.
  // Never publishes, so it runs even while paused: claims that never
  // recorded an outcome go to review, not back to the queue.
  const stuckClaims = await recoverStuckPublishing();

  const due = await runPublishDue({
    dryRun,
    withRefresh: false,
    withAudit: false,
    quiet: true,
  });

  // Paused from Jarvis: publish-due already skipped; do not draw or claim
  // today's plan either, so resuming later in the day still gets a slot.
  if (await isPipelinePaused()) {
    return NextResponse.json({ due, stuckClaims, plan: null, generate: "paused from Jarvis" });
  }

  // Jarvis generates (or the switch could not be read, which fails closed):
  // publishing above already ran; do not draw or claim the site's plan.
  const generation = await siteMayGenerate();
  if (!generation.allowed) {
    return NextResponse.json({
      due,
      stuckClaims,
      plan: null,
      generate: generationSkipMessage(generation.reason),
    });
  }

  // A previous tick may have claimed a slot and then been killed by the
  // function time limit. Hand back anything claimed that never produced a post.
  const plan = await recoverStaleClaim(await getDayPlan());
  const planSummary = {
    day: plan.day,
    go: plan.go,
    slots: plan.slots,
    generatedCount: plan.generatedCount,
    generateAt: plan.generateAt?.toISOString() ?? null,
    secondAt: plan.secondAt?.toISOString() ?? null,
    reason: plan.reason,
    isDue: dayPlanIsDue(plan),
  };

  if (dryRun) {
    return NextResponse.json({ due, plan: planSummary, generate: "skipped (dryRun)" });
  }

  if (!dayPlanIsDue(plan)) {
    return NextResponse.json({ due, plan: planSummary, generate: "not due" });
  }

  const slotIndex = plan.generatedCount;
  const claimed = await claimDayPlan(plan.day, slotIndex);
  if (!claimed) {
    return NextResponse.json({
      due,
      plan: planSummary,
      generate: "claimed by another tick",
    });
  }

  // skipTodayGuard: the per-day cap is enforced by the day plan's slots, so the
  // generator's own one-per-calendar-day check would block the second slot.
  const generate = await runGenerate({
    skipCadence: true,
    skipTodayGuard: true,
  });
  // A skip means no post was produced, so give the slot back: the cadence roll
  // already said today is a posting day, and a later tick can retry.
  if (generate.status === "skip") {
    await releaseDayPlan(plan.day, slotIndex + 1);
  }

  return NextResponse.json({ due, plan: planSummary, generate });
}
