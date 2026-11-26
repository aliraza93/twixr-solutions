import { jarvisHandlers } from "@/lib/jarvis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return jarvisHandlers.listBriefs(req);
}

export async function POST(req: Request) {
  return jarvisHandlers.createBrief(req);
}
