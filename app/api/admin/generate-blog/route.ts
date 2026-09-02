import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/cms/auth";
import { runManualGenerate } from "@/lib/pipeline/manual/run-manual";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const topic = String(body.topic ?? "").trim();
  if (!topic) {
    return NextResponse.json({ error: "topic_required" }, { status: 400 });
  }

  try {
    const outcome = await runManualGenerate({
      topic,
      angle: String(body.angle ?? ""),
      pillar: String(body.pillar ?? ""),
      format: String(body.format ?? ""),
      sourceUrl: String(body.sourceUrl ?? ""),
      additionalInstructions: String(body.additionalInstructions ?? ""),
      generateImages: body.generateImages !== false,
      generateLinkedIn: body.generateLinkedIn !== false,
      publishAutomatically: Boolean(body.publishAutomatically),
      forceEvergreen: Boolean(body.forceEvergreen),
      allowCannibalOverride: Boolean(body.allowCannibalOverride),
      mode: body.mode === "analyze" ? "analyze" : "generate",
    });

    return NextResponse.json(outcome);
  } catch (error) {
    console.error("manual generate failed:", error);
    return NextResponse.json(
      {
        error: "generate_failed",
        message: error instanceof Error ? error.message : "Generate failed",
      },
      { status: 500 }
    );
  }
}
