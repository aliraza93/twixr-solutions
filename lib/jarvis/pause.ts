import type { PrismaClient } from "@prisma/client";
import { requireDb } from "@/lib/cms/db";
import { isDatabaseConfigured } from "@/lib/cms/env";

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

/** Works on the client or inside an interactive transaction. */
export type LogReader = { generationLog: Pick<PrismaClient["generationLog"], "findFirst"> };

export async function getPipelineControl(
  db: LogReader = requireDb()
): Promise<PipelineControl | null> {
  const row = await db.generationLog.findFirst({
    where: { stage: JARVIS_STAGE, refType: PIPELINE_REF_TYPE, status: "ok" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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

/** Swappable in tests; production reads the database. */
export const pauseSource = {
  configured: (): boolean => isDatabaseConfigured(),
  read: (): Promise<PipelineControl | null> => getPipelineControl(),
};

/**
 * Read by the cron entry points. With no database configured there is
 * nothing to pause (and nothing to publish). If the read fails it fails
 * closed: the cron treats the pipeline as paused for that run rather than
 * risk publishing something Jarvis paused.
 */
export async function isPipelinePaused(): Promise<boolean> {
  if (!pauseSource.configured()) return false;
  try {
    return (await pauseSource.read())?.paused ?? false;
  } catch (error) {
    console.error(
      "jarvis pause check failed, treating the pipeline as paused:",
      error instanceof Error ? error.message : "unknown"
    );
    return true;
  }
}
