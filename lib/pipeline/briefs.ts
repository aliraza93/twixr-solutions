import type { Brief } from "@prisma/client";
import { requireDb, withDb } from "@/lib/cms/db";

/** Oldest queued brief due now. Does not mark used. */
export async function takeNextBrief(): Promise<Brief | null> {
  return withDb(async () => {
    const db = requireDb();
    const now = new Date();
    const brief = await db.brief.findFirst({
      where: {
        status: "queued",
        OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
      },
      orderBy: [
        { scheduledFor: { sort: "asc", nulls: "first" } },
        { createdAt: "asc" },
      ],
    });
    return brief;
  }, null);
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
