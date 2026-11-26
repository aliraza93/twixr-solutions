import { jarvisHandlers } from "@/lib/jarvis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The dead-link check fetches up to 30 links (4 at a time, 8 seconds each at worst).
export const maxDuration = 120;

/** Body: a finished blog from Jarvis (see lib/jarvis/CONTRACT.md, intake). */
export async function POST(req: Request) {
  return jarvisHandlers.submitIntake(req);
}
