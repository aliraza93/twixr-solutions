/** Editorial formats from content strategy (Phase 26). SEO must not flatten these. */
export const BLOG_FORMATS = [
  "Teardown",
  "Before / After",
  "Myth vs Reality",
  "Numbers",
  "Checklist",
  "Postmortem",
  "Decision Table",
  "Anti-pattern",
  "Question-led",
  "Receipt",
  "Short Take",
] as const;

export type BlogFormat = (typeof BLOG_FORMATS)[number];

const KEYWORD_HINTS: Array<{ re: RegExp; format: BlogFormat }> = [
  { re: /\b(myth|vs reality|misconception)\b/i, format: "Myth vs Reality" },
  { re: /\b(before|after|refactor|rewrite)\b/i, format: "Before / After" },
  { re: /\b(checklist|steps?|playbook)\b/i, format: "Checklist" },
  { re: /\b(postmortem|outage|incident|failure)\b/i, format: "Postmortem" },
  { re: /\b(anti[- ]?pattern|don'?t|wrong way)\b/i, format: "Anti-pattern" },
  { re: /\b(compare|vs\.?|tradeoff|decision)\b/i, format: "Decision Table" },
  { re: /\b(teardown|dissect|anatomy)\b/i, format: "Teardown" },
  { re: /\b(metric|benchmark|number|%|ms|latency)\b/i, format: "Numbers" },
  { re: /\b(why|should i|when to)\b/i, format: "Question-led" },
  { re: /\b(receipt|proof|client|case)\b/i, format: "Receipt" },
];

/**
 * Pick one editorial format from brief signals (not random SEO sludge).
 */
export function pickBlogFormat(input: {
  topic: string;
  angle?: string;
  pillar: string;
  requiresLiveSource?: boolean;
}): BlogFormat {
  if (input.requiresLiveSource) return "Short Take";
  if (/code\s*card/i.test(input.pillar)) return "Short Take";

  const hay = `${input.topic} ${input.angle || ""}`;
  for (const hint of KEYWORD_HINTS) {
    if (hint.re.test(hay)) return hint.format;
  }

  // Stable rotation from topic string so the same brief stays consistent.
  let hash = 0;
  for (let i = 0; i < hay.length; i++) {
    hash = (hash * 31 + hay.charCodeAt(i)) >>> 0;
  }
  const pool = BLOG_FORMATS.filter((f) => f !== "Short Take");
  return pool[hash % pool.length] || "Teardown";
}

export function formatRotationForPrompt(format: BlogFormat): string {
  return [
    "EDITORIAL FORMAT (keep voice; do not flatten into generic SEO outline):",
    `Preferred format for this run: ${format}`,
    "Available formats (for context): " + BLOG_FORMATS.join("; "),
    "Shape headings and examples around that format. Same topic can use a different format only when search intent differs.",
  ].join("\n");
}
