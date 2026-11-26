import { jarvisHandlers } from "@/lib/jarvis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ kind: string; id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  return jarvisHandlers.getDraft(req, await ctx.params);
}

/**
 * Body: { action: "approve" | "schedule" | "pause" | "resume", at?, reason?, override?,
 * expect?: { state, updatedAt } (blog) | { state, scheduledFor } (social) }. See lib/jarvis/CONTRACT.md.
 */
export async function POST(req: Request, ctx: Ctx) {
  return jarvisHandlers.actOnDraft(req, await ctx.params);
}
