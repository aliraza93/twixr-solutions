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

  // Flush anything whose random publishAt / scheduledFor is already due
  // (Hobby only has ~2 cron windows/day; morning cron catches overnight slots).
  const due = await runPublishDue({ dryRun });
  const generate = await runGenerate({ dryRun, force });

  return NextResponse.json({ due, generate });
}
