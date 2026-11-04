import type { Prisma, PrismaClient } from "@prisma/client";
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

/**
 * Advisory lock key for the switch. setGenerator holds it exclusively; a site
 * generation writing its first row and an intake hold it, so a switch cannot
 * land between their generator check and their insert.
 */
export const GENERATOR_LOCK_KEY = "jarvis:pipeline-generator";

type Tx = Prisma.TransactionClient;

export async function lockGeneratorShared(tx: Tx): Promise<void> {
  await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock_shared(hashtext(${GENERATOR_LOCK_KEY}))) AS l`;
}

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

/** The generator could not be read inside the write transaction. */
class GeneratorReadError extends Error {}

export type GuardedWrite<T> = { ok: true; value: T } | { ok: false; reason: "jarvis" | "unreadable" };

/**
 * Runs `write` in one transaction that holds the generator lock (shared) and
 * re-reads the switch first: it writes only while the site still generates.
 * A failed read or a lock timeout counts as "unreadable" and writes nothing
 * (fail closed); an error from `write` itself is thrown as before.
 */
export async function writeIfSiteGenerates<T>(
  write: (tx: Tx) => Promise<T>,
  db: Pick<PrismaClient, "$transaction"> = requireDb()
): Promise<GuardedWrite<T>> {
  try {
    return await db.$transaction(
      async (tx): Promise<GuardedWrite<T>> => {
        let control: GeneratorControl | null;
        try {
          await lockGeneratorShared(tx);
          control = await getGeneratorControl(tx);
        } catch (error) {
          throw new GeneratorReadError(error instanceof Error ? error.message : "unknown");
        }
        if ((control?.generator ?? DEFAULT_GENERATOR) !== "site") return { ok: false, reason: "jarvis" };
        return { ok: true, value: await write(tx) };
      },
      { timeout: 10_000, maxWait: 5_000 }
    );
  } catch (error) {
    const code = (error as { code?: unknown } | null)?.code;
    if (error instanceof GeneratorReadError || code === "P2028" || code === "P2034") {
      console.error("jarvis generator check failed inside the write, writing nothing:", (error as Error).message);
      return { ok: false, reason: "unreadable" };
    }
    throw error;
  }
}
