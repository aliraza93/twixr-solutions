import { NextResponse } from "next/server";
import { runPublishDue } from "@/lib/pipeline/run-publish-due";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const result = await runPublishDue({ dryRun });
  return NextResponse.json(result);
}
