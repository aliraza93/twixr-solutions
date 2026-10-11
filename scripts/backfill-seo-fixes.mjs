/**
 * Repair the two data defects the SEO audit found on live posts.
 *
 * 1. Four posts store a human-readable date where Schema.org needs ISO 8601,
 *    which renders an invalid datePublished into the Article node.
 * 2. Seven posts open their markdown body with "# Title", duplicating the
 *    page's h1.
 *
 * The write path now prevents both (lib/cms/blog.ts), so this is a one-off
 * repair of what shipped before the guards existed.
 *
 * Usage: node scripts/prisma-env.mjs run node scripts/backfill-seo-fixes.mjs [--apply]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function localIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toIsoDate(value) {
  const raw = (value ?? "").trim();
  if (ISO.test(raw)) return raw;
  const parsed = new Date(raw);
  // Local parts, not toISOString: a locally-parsed midnight shifts back a
  // day in UTC+5 and would move every date by one.
  if (!Number.isNaN(parsed.getTime())) return localIsoDate(parsed);
  return null;
}

function stripLeadingH1(body) {
  const lines = (body ?? "").split("\n");
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i += 1;
  if (i < lines.length && /^#\s+\S/.test(lines[i].trim())) {
    lines.splice(i, 1);
    while (i < lines.length && !lines[i].trim()) lines.splice(i, 1);
    return lines.join("\n").trim();
  }
  return null;
}

const posts = await prisma.blogPost.findMany({
  select: { id: true, slug: true, date: true, body: true, published: true },
});

const dateFixes = [];
const bodyFixes = [];

for (const p of posts) {
  const iso = toIsoDate(p.date);
  if (iso && iso !== p.date) dateFixes.push({ ...p, iso });
  const stripped = stripLeadingH1(p.body);
  if (stripped !== null) bodyFixes.push({ ...p, stripped });
}

console.log(`Posts scanned: ${posts.length}`);
console.log(`\nNon-ISO dates: ${dateFixes.length}`);
for (const f of dateFixes) {
  console.log(`  ${f.slug}\n      ${JSON.stringify(f.date)} -> ${f.iso}`);
}
console.log(`\nBodies opening with a markdown H1: ${bodyFixes.length}`);
for (const f of bodyFixes) {
  const removed = f.body.split("\n").find((l) => l.trim());
  console.log(`  ${f.slug}\n      removing: ${JSON.stringify(removed.slice(0, 64))}`);
  const before = f.body.trim().split(/\s+/).length;
  const after = f.stripped.trim().split(/\s+/).length;
  if (after < before * 0.9) {
    throw new Error(`Refusing ${f.slug}: strip removed too much (${before} -> ${after} words)`);
  }
}

if (!APPLY) {
  console.log("\nDry run. Re-run with --apply to write these changes.");
  await prisma.$disconnect();
  process.exit(0);
}

for (const f of dateFixes) {
  await prisma.blogPost.update({ where: { id: f.id }, data: { date: f.iso } });
}
for (const f of bodyFixes) {
  await prisma.blogPost.update({ where: { id: f.id }, data: { body: f.stripped } });
}

console.log(`\nApplied: ${dateFixes.length} date(s), ${bodyFixes.length} body/bodies.`);
await prisma.$disconnect();
