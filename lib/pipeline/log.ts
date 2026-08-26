import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { requireDb, withDb } from "@/lib/cms/db";

export function createRunId(): string {
  return randomUUID();
}

export type LogStageInput = {
  runId: string;
  stage: string;
  status: "ok" | "warn" | "fail" | "skip";
  refType?: string;
  refId?: string;
  message?: string;
  meta?: Record<string, unknown>;
};

export async function logStage(input: LogStageInput): Promise<void> {
  await withDb(async () => {
    const db = requireDb();
    await db.generationLog.create({
      data: {
        runId: input.runId,
        stage: input.stage,
        status: input.status,
        refType: input.refType ?? "",
        refId: input.refId ?? "",
        message: input.message ?? "",
        meta: (input.meta ?? {}) as Prisma.InputJsonValue,
      },
    });
  }, undefined);
}
