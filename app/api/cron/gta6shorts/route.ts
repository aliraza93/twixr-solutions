import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/security/bearer";
import { takeGta6BriefIfDue } from "@/lib/pipeline/product/gta6-lane";
import { runGenerate } from "@/lib/pipeline/run-generate";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * GTA6 Shorts lane: Mon, Wed and Fri (Karachi) at the vercel.json time.
 * Writes one GTA6 Shorts blog with its LinkedIn companion (and a company
 * page version when LINKEDIN_ORG_URN is set). The post goes live through the
 * normal publish tick at its drawn time, like every other post.
 *
 * Separate from the daily editorial plan, so it neither uses up nor waits for
 * a day slot. It still obeys PIPELINE_ENABLED, the Jarvis pause and the
 * generator switch, because runGenerate checks them.
 *
 * The lane's first ever run is the launch post: it runs on any day and
 * publishes at once, so pressing Run in Vercel's Cron Jobs page sends it.
 * ?force=1 runs today even off a lane day.
 * ?now=1 publishes the blog immediately and the LinkedIn post ~20 minutes
 * later, instead of at drawn times (for a launch post).
 * ?dryRun=1 shows the decision without generating.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const force = url.searchParams.get("force") === "1";
  let now = url.searchParams.get("now") === "1";

  if (dryRun) {
    return NextResponse.json({ lane: "gta6shorts", generate: "skipped (dryRun)" });
  }

  const decision = await takeGta6BriefIfDue(new Date(), { force });
  if (!decision.due) {
    return NextResponse.json({ lane: "gta6shorts", generate: decision.reason });
  }

  // The launch post (the lane's first ever) publishes immediately.
  if (decision.launch) now = true;

  const generate = await runGenerate({
    briefId: decision.brief.id,
    skipCadence: true,
    skipTodayGuard: true,
    ...(now ? { publishMode: "publish_now" as const, linkedInSoon: true } : {}),
  });

  return NextResponse.json({
    lane: "gta6shorts",
    topic: decision.brief.topic,
    generate,
  });
}
