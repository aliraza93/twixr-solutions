/**
 * Mark non-topic briefs (intro rules accidentally seeded) as skipped.
 */
import { PrismaClient } from "@prisma/client";
import { applyDatabaseUrlAlias } from "../lib/cms/env";

applyDatabaseUrlAlias();
const prisma = new PrismaClient();

const BAD_TOPIC_PREFIXES = [
  "Reach for the 2nd",
  "Never reuse a (topic",
  "Rotate FORMAT too",
  "Inventing a fresh angle",
];

async function main() {
  const queued = await prisma.brief.findMany({
    where: { status: { in: ["queued", "used"] } },
    select: { id: true, topic: true, status: true },
  });

  const bad = queued.filter((b) =>
    BAD_TOPIC_PREFIXES.some((p) => b.topic.startsWith(p))
  );

  for (const b of bad) {
    await prisma.brief.update({
      where: { id: b.id },
      data: { status: "skipped" },
    });
  }

  console.log(`Marked ${bad.length} meta-rule briefs as skipped`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
