import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/security/bearer";
import { runPublishDue } from "@/lib/pipeline/run-publish-due";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const result = await runPublishDue({ dryRun });
  return NextResponse.json(result);
}
