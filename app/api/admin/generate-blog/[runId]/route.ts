import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/cms/auth";
import { requireDb, withDb } from "@/lib/cms/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ runId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { runId } = await ctx.params;
  if (!runId) {
    return NextResponse.json({ error: "missing_run_id" }, { status: 400 });
  }

  const logs = await withDb(async () => {
    const db = requireDb();
    return db.generationLog.findMany({
      where: { runId },
      orderBy: { createdAt: "asc" },
    });
  }, []);

  const done = logs.some(
    (l) =>
      (l.stage === "notify" && l.status === "ok") ||
      (l.stage === "blog" && l.status === "fail") ||
      (l.stage === "brief" && l.status === "skip" && /cannibal/i.test(l.message))
  );

  return NextResponse.json({
    runId,
    done,
    logs: logs.map((l) => ({
      id: l.id,
      stage: l.stage,
      status: l.status,
      message: l.message,
      refType: l.refType,
      refId: l.refId,
      meta: l.meta,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
