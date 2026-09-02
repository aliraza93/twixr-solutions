import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function topicBankPath(): string {
  return join(process.cwd(), "content/pipeline/topic-bank.md");
}

function sectionHeaderForPillar(pillar: string): { major: string; sub?: string } {
  if (/^code\s*card/i.test(pillar)) {
    return { major: "## CODE CARDS" };
  }
  if (/^timely/i.test(pillar)) {
    return { major: "## TIMELY" };
  }
  if (/^business/i.test(pillar)) {
    return { major: "## BUSINESS" };
  }
  const sub = pillar.split("/")[1]?.trim();
  if (sub) {
    // Match ### Laravel style headers under BUILD
    return { major: "## BUILD", sub: `### ${sub}` };
  }
  return { major: "## BUILD" };
}

/**
 * Append a normalized manual topic to topic-bank.md so seed stays aware.
 * Marks as MANUAL so seed-briefs skip (USED/MANUAL lines).
 */
export function appendManualTopicToBank(input: {
  topic: string;
  pillar: string;
}): { appended: boolean; reason: string } {
  const path = topicBankPath();
  let md = readFileSync(path, "utf8");
  const topic = input.topic.trim();
  if (!topic) return { appended: false, reason: "empty topic" };

  const lower = topic.toLowerCase();
  const already = md
    .split("\n")
    .some((line) => {
      const m = line.match(/^\s*-\s+(.+?)(?:\s+\((?:USED|MANUAL)[^)]*\))?\s*$/);
      if (!m) return false;
      return m[1].trim().toLowerCase() === lower;
    });
  if (already) {
    return { appended: false, reason: "already in topic-bank" };
  }

  const { major, sub } = sectionHeaderForPillar(input.pillar);
  const date = new Date().toISOString().slice(0, 10);
  const bullet = `- ${topic} (MANUAL ${date})`;

  const majorIdx = md.indexOf(major);
  if (majorIdx < 0) {
    md = `${md.trimEnd()}\n\n${major}\n\n${bullet}\n`;
    writeFileSync(path, md, "utf8");
    return { appended: true, reason: "appended new major section" };
  }

  let insertAt = -1;
  if (sub) {
    const from = md.indexOf(sub, majorIdx);
    if (from >= 0) {
      // Insert after this ### block's existing bullets (before next ### or ##)
      const rest = md.slice(from);
      const next = rest.search(/\n### |\n## /);
      insertAt = next >= 0 ? from + next : md.length;
    }
  }

  if (insertAt < 0) {
    // End of major section (before next ## at same level after major)
    const after = md.slice(majorIdx + major.length);
    const nextMajor = after.search(/\n## /);
    insertAt =
      nextMajor >= 0 ? majorIdx + major.length + nextMajor : md.length;
  }

  const before = md.slice(0, insertAt).replace(/\s*$/, "\n");
  const after = md.slice(insertAt).replace(/^\s*/, "\n");
  writeFileSync(path, `${before}${bullet}${after}`, "utf8");
  return { appended: true, reason: "appended under pillar section" };
}
