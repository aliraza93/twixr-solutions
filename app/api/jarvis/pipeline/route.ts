import { jarvisHandlers } from "@/lib/jarvis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Body: { action: "pause" | "resume", reason? } or { action: "set_generator", generator: "site" | "jarvis", reason? } */
export async function POST(req: Request) {
  return jarvisHandlers.actOnPipeline(req);
}
