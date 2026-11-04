import { requireDb, withDb } from "@/lib/cms/db";

/**
 * Pipeline pause, kept in the pipeline's own GenerationLog rather than a new
 * table: the latest Jarvis control row for the pipeline (stage "jarvis",
 * refType "Pipeline") says paused or running. One source of truth, a full
 * audit trail for free, and no schema change for the cron to trip over.
 *
 * PIPELINE_ENABLED=false still wins over everything; this is a softer,
 * reversible switch Jarvis can flip at runtime.
 */

export const JARVIS_STAGE = "jarvis";
export const JARVIS_SOURCE = "jarvis";
export const PIPELINE_REF_TYPE = "Pipeline";
export const PIPELINE_REF_ID = "pipeline";

export type PipelineControl = {
  paused: boolean;
  at: Date;
  reason: string;
};

export async function getPipelineControl(): Promise<PipelineControl | null> {
  const db = requireDb();
  const row = await db.generationLog.findFirst({
    where: { stage: JARVIS_STAGE, refType: PIPELINE_REF_TYPE, status: "ok" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, meta: true },
  });
  if (!row) return null;
  const meta = (row.meta ?? {}) as Record<string, unknown>;
  return {
    paused: meta.action === "pause",
    at: row.createdAt,
    reason: typeof meta.reason === "string" ? meta.reason : "",
  };
}

/**
 * Read by the cron entry points. On a database error it reports "not paused",
 * so the cron behaves exactly as it did before this switch existed.
 */
export async function isPipelinePaused(): Promise<boolean> {
  return withDb(async () => (await getPipelineControl())?.paused ?? false, false);
}
