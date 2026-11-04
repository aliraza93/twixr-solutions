import { jarvisHandlers } from "@/lib/jarvis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return jarvisHandlers.listLogs(req);
}
