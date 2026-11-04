import { jarvisHandlers } from "@/lib/jarvis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Body: { action: "pause" | "resume", reason? } */
export async function POST(req: Request) {
  return jarvisHandlers.actOnPipeline(req);
}
