/**
 * Seed Brief rows from content/pipeline/topic-bank.md.
 * Usage: npm run seed:briefs
 * Skips topics marked (USED ...) and topics already present in Brief.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { applyDatabaseUrlAlias } from "../lib/cms/env";

applyDatabaseUrlAlias();
const prisma = new PrismaClient();

type ParsedTopic = {
  pillar: string;
  topic: string;
  requiresLiveSource: boolean;
};

function parseTopicBank(md: string): ParsedTopic[] {
  const lines = md.split("\n");
  let basePillar = "Build";
  let pillar = "Build";
  let requiresLiveSource = false;
  const out: ParsedTopic[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      const heading = line.slice(3).trim();
      const upper = heading.toUpperCase();
      if (upper.startsWith("BUILD")) {
        basePillar = "Build";
        requiresLiveSource = false;
      } else if (upper.startsWith("TIMELY")) {
        basePillar = "Timely";
        requiresLiveSource = true;
      } else if (upper.startsWith("BUSINESS")) {
        basePillar = "Business";
        requiresLiveSource = false;
      } else if (upper.startsWith("CODE CARDS")) {
        basePillar = "Code card";
        requiresLiveSource = false;
      } else if (upper.startsWith("FORMAT")) {
        basePillar = "Build";
        requiresLiveSource = false;
      } else {
        basePillar = heading.split(/\s+/)[0] || "Build";
        requiresLiveSource = false;
      }
      pillar = basePillar;
      continue;
    }
    if (line.startsWith("### ")) {
      const sub = line.slice(4).trim();
      pillar = `${basePillar}/${sub}`;
      continue;
    }
    if (!line.startsWith("- ")) continue;
    let topic = line.slice(2).trim();
    if (!topic) continue;
    if (/\(USED\b/i.test(topic)) continue;
    topic = topic.replace(/\s*\(USED[^)]*\)\s*/gi, "").trim();
    if (!topic) continue;
    out.push({ pillar, topic, requiresLiveSource });
  }

  return out;
}

async function main() {
  const path = join(process.cwd(), "content/pipeline/topic-bank.md");
  const md = readFileSync(path, "utf8");
  const topics = parseTopicBank(md);
  console.log(`Parsed ${topics.length} unused topics from topic-bank.md`);

  const existing = await prisma.brief.findMany({
    select: { topic: true },
  });
  const have = new Set(existing.map((b) => b.topic.toLowerCase()));

  let created = 0;
  for (const t of topics) {
    if (have.has(t.topic.toLowerCase())) continue;
    await prisma.brief.create({
      data: {
        pillar: t.pillar,
        topic: t.topic,
        targetKeyword: t.topic.slice(0, 80),
        angle: "",
        realExample: "",
        requiresLiveSource: t.requiresLiveSource,
        status: "queued",
      },
    });
    created += 1;
    have.add(t.topic.toLowerCase());
  }

  const remaining = await prisma.brief.count({ where: { status: "queued" } });
  console.log(`Created ${created} briefs. Queued total: ${remaining}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
