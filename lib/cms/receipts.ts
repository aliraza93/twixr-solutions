"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/cms/auth";
import { requireDb, withDb } from "@/lib/cms/db";

/**
 * Admin CRUD for receipts: the bank of real, verified, anonymized material
 * that is the only source of first-hand claims in the content pipeline.
 */

export type ReceiptRow = {
  id: string;
  cluster: string;
  kind: string;
  summary: string;
  detail: string;
  outcome: string;
  usedCount: number;
  lastUsedAt: string | null;
  active: boolean;
};

export async function listReceipts(): Promise<ReceiptRow[]> {
  return withDb(async () => {
    const db = requireDb();
    const rows = await db.receipt.findMany({
      orderBy: [{ active: "desc" }, { cluster: "asc" }, { createdAt: "desc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      cluster: r.cluster,
      kind: r.kind,
      summary: r.summary,
      detail: r.detail,
      outcome: r.outcome,
      usedCount: r.usedCount,
      lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
      active: r.active,
    }));
  }, []);
}

export async function saveReceipt(formData: FormData): Promise<void> {
  await requireUser();

  const id = String(formData.get("id") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  if (!summary) return;

  const data = {
    cluster: String(formData.get("cluster") ?? "").trim(),
    kind: String(formData.get("kind") ?? "incident").trim(),
    summary,
    detail: String(formData.get("detail") ?? "").trim(),
    outcome: String(formData.get("outcome") ?? "").trim(),
    active: formData.get("active") === "on",
  };

  await withDb(async () => {
    const db = requireDb();
    if (id) {
      await db.receipt.update({ where: { id }, data });
    } else {
      await db.receipt.create({ data });
    }
  }, undefined);

  revalidatePath("/admin/receipts");
}

export async function toggleReceipt(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  await withDb(async () => {
    const db = requireDb();
    const row = await db.receipt.findUnique({
      where: { id },
      select: { active: true },
    });
    if (!row) return;
    await db.receipt.update({ where: { id }, data: { active: !row.active } });
  }, undefined);

  revalidatePath("/admin/receipts");
}

export async function deleteReceipt(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  await withDb(async () => {
    const db = requireDb();
    await db.receipt.delete({ where: { id } });
  }, undefined);

  revalidatePath("/admin/receipts");
}
