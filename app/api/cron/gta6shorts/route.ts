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
 * ?force=1 runs today even off a lane day (for a manual first post).
 * ?dryRun=1 shows the decision without generating.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const force = url.searchParams.get("force") === "1";

  if (dryRun) {
    return NextResponse.json({ lane: "gta6shorts", generate: "skipped (dryRun)" });
  }

  const decision = await takeGta6BriefIfDue(new Date(), { force });
  if (!decision.due) {
    return NextResponse.json({ lane: "gta6shorts", generate: decision.reason });
  }

  const generate = await runGenerate({
    briefId: decision.brief.id,
    skipCadence: true,
    skipTodayGuard: true,
  });

  return NextResponse.json({
    lane: "gta6shorts",
    topic: decision.brief.topic,
    generate,
  });
}
