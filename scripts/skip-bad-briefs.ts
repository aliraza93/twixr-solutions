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
  // Vague Timely slots replaced on 2026-10-18 by named-release versions.
  // They produced templated posts such as "Hype vs Reality on Whatever
  // Everyone Is Posting".
  "Builder's take on a just-released model",
  "New Laravel / NestJS / React version",
  "An AI dev tool that earned or lost a spot",
  "Hype vs reality on whatever",
  "What a model's pricing or limits mean",
  "A deprecation or breaking change worth planning",
  "Benchmark claims vs what you measured",
];

async function main() {
  const queued = await prisma.brief.findMany({
    where: { status: "queued" },
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
