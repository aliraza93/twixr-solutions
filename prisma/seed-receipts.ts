/**
 * Seed the Receipt table with the real, already-published facts this project
 * has on record, then let Ali complete them.
 *
 * Everything here is seeded INACTIVE on purpose. A receipt is the only source
 * of first-hand claims in the whole pipeline, so a half-filled one is worse
 * than none: the generator would anchor a post on a summary with no specifics.
 * Fill in `detail` and `outcome`, set `active` to true, and it enters rotation.
 *
 * Usage: npm run seed:receipts
 */
import { PrismaClient } from "@prisma/client";
import { applyDatabaseUrlAlias } from "../lib/cms/env";

applyDatabaseUrlAlias();
const prisma = new PrismaClient();

type Seed = {
  cluster: string;
  kind: string;
  summary: string;
};

/**
 * Drawn from topics already marked USED in content/pipeline/topic-bank.md, so
 * these are things that genuinely happened and have already been written about.
 * The specifics are deliberately left blank rather than guessed.
 */
const SEEDS: Seed[] = [
  {
    cluster: "Databases",
    kind: "incident",
    summary: "N+1 on an invoice listing: 900 queries reduced to 6",
  },
  {
    cluster: "AWS",
    kind: "incident",
    summary:
      "Connection pool exhaustion triggered by a marketing send",
  },
  {
    cluster: "AWS",
    kind: "number",
    summary: "Cloud bill cut without dropping any feature",
  },
  {
    cluster: "Laravel",
    kind: "incident",
    summary: "CSV export blew up memory until it was moved to lazy collections",
  },
  {
    cluster: "Databases",
    kind: "incident",
    summary: "A migration that locked a table in production",
  },
  {
    cluster: "Upwork",
    kind: "decision",
    summary:
      "Rewriting a profile headline around outcomes instead of a tool list",
  },
  {
    cluster: "API design",
    kind: "decision",
    summary: "Adding idempotency keys after a duplicate-charge near miss",
  },
  {
    cluster: "Testing",
    kind: "artifact",
    summary: "A 400-line controller refactored into something testable",
  },
];

async function main() {
  const existing = await prisma.receipt.findMany({ select: { summary: true } });
  const have = new Set(existing.map((r) => r.summary.toLowerCase()));

  let created = 0;
  for (const seed of SEEDS) {
    if (have.has(seed.summary.toLowerCase())) continue;
    await prisma.receipt.create({
      data: {
        cluster: seed.cluster,
        kind: seed.kind,
        summary: seed.summary,
        detail: "",
        outcome: "",
        // Inactive until the specifics are filled in by hand.
        active: false,
      },
    });
    created += 1;
  }

  const total = await prisma.receipt.count();
  const active = await prisma.receipt.count({ where: { active: true } });

  console.log(`Created ${created} receipt stub(s). Total ${total}, active ${active}.`);
  console.log("");
  console.log("Next step: open /admin/receipts, fill in detail and outcome for");
  console.log("each one, and activate it. Until a receipt is active the");
  console.log("generator writes with no first-hand experience at all, which is");
  console.log("the single biggest quality gap in the pipeline.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
