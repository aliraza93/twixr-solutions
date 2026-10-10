import { requireDb, withDb } from "@/lib/cms/db";

/**
 * Every randomized decision is written here so the sampler can avoid recent
 * values and the variety audit can measure what actually shipped instead of
 * trusting that the code is random.
 */
export type ChoiceRow = { dimension: string; value: string };

export async function recordChoices(
  runId: string,
  choices: ChoiceRow[],
  blogPostId = ""
): Promise<void> {
  if (!choices.length) return;
  await withDb(async () => {
    const db = requireDb();
    await db.varietyChoice.createMany({
      data: choices.map((c) => ({
        runId,
        dimension: c.dimension,
        value: c.value,
        blogPostId,
      })),
    });
  }, undefined);
}

/** Attach a blogPostId to this run's rows once the post exists. */
export async function attachChoicesToPost(
  runId: string,
  blogPostId: string
): Promise<void> {
  await withDb(async () => {
    const db = requireDb();
    await db.varietyChoice.updateMany({
      where: { runId, blogPostId: "" },
      data: { blogPostId },
    });
  }, undefined);
}

/** Most recent values for one dimension, newest first. */
export async function recentValues(
  dimension: string,
  limit = 8
): Promise<string[]> {
  return withDb(async () => {
    const db = requireDb();
    const rows = await db.varietyChoice.findMany({
      where: { dimension },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { value: true },
    });
    return rows.map((r) => r.value);
  }, []);
}

/**
 * One query for every dimension the plan needs, so building a plan costs a
 * single round trip instead of twenty.
 */
export async function recentValuesMany(
  dimensions: string[],
  perDimension = 8
): Promise<Record<string, string[]>> {
  const empty: Record<string, string[]> = {};
  for (const d of dimensions) empty[d] = [];

  return withDb(async () => {
    const db = requireDb();
    const rows = await db.varietyChoice.findMany({
      where: { dimension: { in: dimensions } },
      orderBy: { createdAt: "desc" },
      take: perDimension * dimensions.length * 3,
      select: { dimension: true, value: true },
    });
    const out: Record<string, string[]> = { ...empty };
    for (const row of rows) {
      const list = out[row.dimension];
      if (list && list.length < perDimension) list.push(row.value);
    }
    return out;
  }, empty);
}
