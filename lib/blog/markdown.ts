export type BlogFaq = {
  question: string;
  answer: string;
};

export type TocItem = {
  id: string;
  text: string;
  level: number;
};

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Strip markdown markers from heading text for TOC labels. */
export function plainHeadingText(raw: string) {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]+/g, "")
    .trim();
}

export function getMarkdownToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const seen = new Map<string, number>();

  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;
    if (/^faq$/i.test(plainHeadingText(match[2])) || /^frequently asked questions$/i.test(plainHeadingText(match[2]))) {
      continue;
    }
    const level = match[1].length;
    const text = plainHeadingText(match[2]);
    if (!text) continue;
    let id = slugifyHeading(text);
    const count = seen.get(id) ?? 0;
    if (count > 0) id = `${id}-${count}`;
    seen.set(slugifyHeading(text), count + 1);
    items.push({ id, text, level });
  }

  return items;
}

const FAQ_HEADING = /^#{2,3}\s+(faq|frequently asked questions)\s*$/i;

/**
 * Extract Q&A pairs from a ## FAQ section.
 * Supports:
 *   **Question?**
 *   Answer line(s)
 * and
 *   ### Question?
 *   Answer line(s)
 */
export function extractFaqsFromMarkdown(markdown: string): BlogFaq[] {
  const lines = markdown.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (FAQ_HEADING.test(lines[i].trim())) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return [];

  const section: string[] = [];
  for (let i = start; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i]) && !FAQ_HEADING.test(lines[i].trim())) break;
    section.push(lines[i]);
  }

  const faqs: BlogFaq[] = [];
  let question: string | null = null;
  let answer: string[] = [];

  const flush = () => {
    if (question && answer.join("\n").trim()) {
      faqs.push({
        question: plainHeadingText(question),
        answer: answer.join("\n").trim(),
      });
    }
    question = null;
    answer = [];
  };

  for (const line of section) {
    const boldQ = line.match(/^\*\*(.+?)\*\*\s*$/);
    const h3Q = line.match(/^###\s+(.+)$/);
    if (boldQ || h3Q) {
      flush();
      question = (boldQ?.[1] ?? h3Q?.[1] ?? "").trim();
      continue;
    }
    if (question) answer.push(line);
  }
  flush();

  return faqs;
}

/** Remove the FAQ section from markdown so it can render as a structured accordion instead. */
export function stripFaqSection(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  let skipping = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (FAQ_HEADING.test(line.trim())) {
      skipping = true;
      continue;
    }
    if (skipping && /^##\s+/.test(line) && !FAQ_HEADING.test(line.trim())) {
      skipping = false;
    }
    if (!skipping) out.push(line);
  }

  return out.join("\n").trim();
}

export function normalizeFaqs(value: unknown): BlogFaq[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const q = "question" in item ? String((item as BlogFaq).question ?? "").trim() : "";
      const a = "answer" in item ? String((item as BlogFaq).answer ?? "").trim() : "";
      if (!q || !a) return null;
      return { question: q, answer: a };
    })
    .filter((item): item is BlogFaq => Boolean(item));
}
