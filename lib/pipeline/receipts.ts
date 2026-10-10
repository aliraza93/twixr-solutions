import { requireDb, withDb } from "@/lib/cms/db";
import type { Rng } from "@/lib/pipeline/variety/rng";

/**
 * Receipts: real, verified, anonymized material from actual client work.
 *
 * The generator is forbidden from inventing metrics, clients, and incidents,
 * and `Brief.realExample` is almost always empty, so posts ship with no
 * first-hand experience in them. That is the single biggest quality gap in the
 * pipeline: it is what Google's helpful-content guidance asks for and what a
 * reader can tell is missing.
 *
 * This bank is the only source of first-hand claims. Nothing here is generated;
 * every row is something that actually happened, entered by hand.
 */

export type Receipt = {
  id: string;
  cluster: string;
  kind: string;
  summary: string;
  detail: string;
  outcome: string;
};

/**
 * Receipts for a topic, least recently used first so the bank rotates instead
 * of leaning on whichever row matches best.
 */
export async function receiptsForBrief(
  input: { pillar: string; topic: string; targetKeyword?: string },
  limit = 2,
  rng?: Rng
): Promise<Receipt[]> {
  const cluster =
    input.pillar.split("/")[1]?.trim() || input.pillar.split("/")[0]?.trim() || "";

  const rows = await withDb(async () => {
    const db = requireDb();
    const scoped = cluster
      ? await db.receipt.findMany({
          where: { active: true, cluster: { equals: cluster, mode: "insensitive" } },
          orderBy: [{ usedCount: "asc" }, { lastUsedAt: "asc" }],
          take: limit * 3,
        })
      : [];

    if (scoped.length >= limit) return scoped;

    // Fall back to the general pool so a thin cluster still gets something.
    const general = await db.receipt.findMany({
      where: {
        active: true,
        ...(cluster
          ? { NOT: { cluster: { equals: cluster, mode: "insensitive" } } }
          : {}),
      },
      orderBy: [{ usedCount: "asc" }, { lastUsedAt: "asc" }],
      take: limit * 3,
    });
    return [...scoped, ...general];
  }, []);

  if (!rows.length) return [];

  // Shuffle within the least-used window so the same two rows do not always
  // pair up for the same cluster.
  const window = rows.slice(0, Math.max(limit, Math.min(rows.length, limit * 2)));
  const ordered = rng ? rng.shuffle(window) : window;

  return ordered.slice(0, limit).map((r) => ({
    id: r.id,
    cluster: r.cluster,
    kind: r.kind,
    summary: r.summary,
    detail: r.detail,
    outcome: r.outcome,
  }));
}

export async function markReceiptsUsed(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await withDb(async () => {
    const db = requireDb();
    await db.receipt.updateMany({
      where: { id: { in: ids } },
      data: { usedCount: { increment: 1 }, lastUsedAt: new Date() },
    });
  }, undefined);
}

/**
 * The prompt block. Deliberately strict: these are the only first-hand claims
 * the model may make, and it must not dress them up.
 */
export function formatReceiptsForPrompt(receipts: Receipt[]): string {
  if (!receipts.length) {
    return [
      "FIRST-HAND EXPERIENCE: none available for this topic.",
      "Do not invent an incident, a client, a number, or a war story.",
      "Write from general engineering judgement instead, and say nothing that implies a specific past project.",
    ].join("\n");
  }

  const lines = [
    "FIRST-HAND EXPERIENCE (real, verified, anonymized - the ONLY personal claims you may make):",
  ];
  for (const r of receipts) {
    lines.push("");
    lines.push(`[${r.kind}${r.cluster ? ` / ${r.cluster}` : ""}] ${r.summary}`);
    if (r.detail) lines.push(`  Specifics: ${r.detail}`);
    if (r.outcome) lines.push(`  Outcome: ${r.outcome}`);
  }
  lines.push("");
  lines.push("Rules for using these:");
  lines.push("- Use at least one of them as a concrete anchor in the body.");
  lines.push("- Keep every number exactly as written. Do not round, scale, or embellish.");
  lines.push("- Never name a client or anything identifying, even if you can infer it.");
  lines.push("- Do not add detail that is not here. If you need more, describe less.");
  lines.push("- If one does not fit this angle, leave it out rather than forcing it.");

  return lines.join("\n");
}

export async function activeReceiptCount(): Promise<number> {
  return withDb(async () => {
    const db = requireDb();
    return db.receipt.count({ where: { active: true } });
  }, 0);
}
