import type { Brief } from "@prisma/client";
import { requireDb, withDb } from "@/lib/cms/db";

/** Oldest queued brief due now. Does not mark used. */
export async function takeNextBrief(): Promise<Brief | null> {
  const db = requireDb();
  const now = new Date();
  // Avoid withDb null-fallback here: a DB/Prisma error would look like an empty queue.
  return db.brief.findFirst({
    where: {
      status: "queued",
      OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
    },
    orderBy: [{ createdAt: "asc" }],
  });
}

export async function markBriefUsed(id: string): Promise<void> {
  const db = requireDb();
  await db.brief.update({
    where: { id },
    data: { status: "used", usedAt: new Date() },
  });
}

export async function remainingBriefCount(): Promise<number> {
  return withDb(async () => {
    const db = requireDb();
    return db.brief.count({ where: { status: "queued" } });
  }, 0);
}
