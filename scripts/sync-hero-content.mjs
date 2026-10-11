/**
 * Push content/hero.ts into the stored siteSettings row.
 *
 * getHero() merges the stored CMS row OVER the file, so a hero edited only in
 * code never reaches the live site once a row exists. This syncs the fields
 * the hero composition owns and leaves everything else in the row untouched.
 *
 * Usage: node scripts/prisma-env.mjs run node scripts/sync-hero-content.mjs
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();

// Read the fields straight out of the compiled source rather than importing
// the TS module, so this runs without a build step.
const src = readFileSync("content/hero.ts", "utf8");

function block(name) {
  const start = src.indexOf(`${name}:`);
  if (start === -1) throw new Error(`Field not found in content/hero.ts: ${name}`);
  return src.slice(start);
}

const stableHeading = block("stableHeading").match(/stableHeading:\s*"([^"]+)"/)?.[1];
if (!stableHeading) throw new Error("Could not parse stableHeading");

// Mirrors lib/cms/hero-headline.ts parseHeadline():
// "Ship faster. **Stay up.** Cut the cloud bill."
const headingLines = [
  [
    { kind: "plain", text: "Ship" },
    { kind: "plain", text: "faster." },
    { kind: "emphasis", text: "Stay" },
    { kind: "emphasis", text: "up." },
    { kind: "plain", text: "Cut" },
    { kind: "plain", text: "the" },
    { kind: "plain", text: "cloud" },
    { kind: "plain", text: "bill." },
  ],
];

const stats = [
  { label: "Job success", value: "100", unit: "%" },
  { label: "Hours delivered", value: "2,600", unit: "+" },
  { label: "Jobs shipped", value: "49", unit: "" },
  { label: "Years in", value: "8", unit: "+" },
];

const subheading =
  "Multi-tenant SaaS, APIs and AWS infrastructure on Laravel, Node.js and Next.js - built to carry real traffic, survive launch day, and stay cheap to run.";

const row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
if (!row) {
  console.log("No siteSettings row; content/hero.ts is already the live source.");
  await prisma.$disconnect();
  process.exit(0);
}

const current = row.hero ?? {};
const rating = { score: "4.7", count: "40 reviews" };

const bento = {
  result: {
    eyebrow: "Performance",
    from: "900",
    to: "6",
    caption: "queries on one invoice list",
  },
  proof: { value: "100%", label: "job success", note: "49 projects delivered" },
  cost: {
    eyebrow: "Cloud cost",
    title: "Bill down, features intact",
    note: "nothing cut to get there",
  },
  code: {
    file: "reliability.ts",
    lines: [
      "// keep the job alive,",
      "// not the incident",
      "tries: 5,",
      "backoff: [10, 30, 90],",
      'onFail: page("oncall"),',
    ],
  },
};

const next = {
  ...current,
  stableHeading,
  headingLines,
  subheading,
  stats,
  rating,
  bento,
  // The rotating word is retired; an empty list keeps older readers happy.
  rotatingWords: [],
};

await prisma.siteSettings.update({
  where: { id: "default" },
  data: { hero: next },
});

console.log("Stored hero updated.");
console.log("  heading:", stableHeading);
console.log("  stats:  ", stats.map((s) => `${s.value}${s.unit} ${s.label}`).join(" | "));
console.log("  bento:  ", [`${bento.result.from} -> ${bento.result.to}`, bento.proof.value, bento.cost.title, bento.code.file].join(" | "));

await prisma.$disconnect();
