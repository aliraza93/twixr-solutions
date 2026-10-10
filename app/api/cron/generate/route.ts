import { NextResponse } from "next/server";
import { runGenerate } from "@/lib/pipeline/run-generate";
import { runPublishDue } from "@/lib/pipeline/run-publish-due";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const force = url.searchParams.get("force") === "1";

  // Daily safety net behind the 10-minute tick: flush anything due, run the
  // weekly content refresh, and run the variety audit. Generation itself is
  // normally driven by the tick at the day plan's drawn hour; this path only
  // generates when explicitly forced, so the two do not race.
  const due = await runPublishDue({ dryRun });
  const generate = force
    ? await runGenerate({ dryRun, force })
    : { status: "skip", message: "Generation is driven by /api/cron/tick" };

  return NextResponse.json({ due, generate });
}
