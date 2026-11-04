import { requireDb } from "@/lib/cms/db";
import { isDatabaseConfigured } from "@/lib/cms/env";
import { JARVIS_STAGE, type LogReader } from "@/lib/jarvis/pause";

/**
 * Who writes new posts for this site: the site's own cron ("site") or Jarvis
 * through /api/jarvis/intake ("jarvis"). Only one side generates at a time
 * (D-046). Kept like the pause: the latest Jarvis control row with refType
 * "PipelineGenerator" in generation_logs. No row means "site".
 *
 * The switch only gates generation. Publishing due posts, the stuck-claim
 * sweep and the weekly refresh run whichever side generates, so the site's
 * tick stays the only publisher.
 */

export const GENERATOR_REF_TYPE = "PipelineGenerator";
export const GENERATOR_REF_ID = "generator";
export const GENERATORS = ["site", "jarvis"] as const;
export type Generator = (typeof GENERATORS)[number];
export const DEFAULT_GENERATOR: Generator = "site";

export type GeneratorControl = {
  generator: Generator;
  at: Date;
  reason: string;
};

function isGenerator(value: unknown): value is Generator {
  return value === "site" || value === "jarvis";
}

/** Works on the client or inside an interactive transaction. A row without a valid value throws. */
export async function getGeneratorControl(
  db: LogReader = requireDb()
): Promise<GeneratorControl | null> {
  const row = await db.generationLog.findFirst({
    where: { stage: JARVIS_STAGE, refType: GENERATOR_REF_TYPE, status: "ok" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { createdAt: true, meta: true },
  });
  if (!row) return null;
  const meta = (row.meta ?? {}) as Record<string, unknown>;
  if (!isGenerator(meta.generator)) {
    throw new Error("The latest generator control row has no valid generator");
  }
  return {
    generator: meta.generator,
    at: row.createdAt,
    reason: typeof meta.reason === "string" ? meta.reason : "",
  };
}

/** Swappable in tests; production reads the database. */
export const generatorSource = {
  configured: (): boolean => isDatabaseConfigured(),
  read: (): Promise<GeneratorControl | null> => getGeneratorControl(),
};

export type SiteGeneration =
  | { allowed: true }
  | { allowed: false; reason: "jarvis" | "unreadable" };

/**
 * Read by the site's generators (tick, /api/cron/generate). With no database
 * configured there is nothing to write to, so it reports allowed like the
 * pause does. If the read fails it fails closed against double writing:
 * generation is skipped for that run, and publishing carries on.
 */
export async function siteMayGenerate(): Promise<SiteGeneration> {
  if (!generatorSource.configured()) return { allowed: true };
  try {
    const control = await generatorSource.read();
    return (control?.generator ?? DEFAULT_GENERATOR) === "site"
      ? { allowed: true }
      : { allowed: false, reason: "jarvis" };
  } catch (error) {
    console.error(
      "jarvis generator check failed, skipping site generation:",
      error instanceof Error ? error.message : "unknown"
    );
    return { allowed: false, reason: "unreadable" };
  }
}

export function generationSkipMessage(reason: "jarvis" | "unreadable"): string {
  return reason === "jarvis"
    ? "Generation handed to Jarvis"
    : "Generator setting unreadable; generation skipped, publishing continues";
}
