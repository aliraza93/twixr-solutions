import type { BlogFaq } from "@/lib/blog/markdown";
import {
  extractFaqsFromMarkdown,
  getMarkdownToc,
  normalizeFaqs,
  stripFaqSection,
} from "@/lib/blog/markdown";

export type BlogContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; id: string; level: 2 | 3; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; src: string; alt: string };

export type BlogListing = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  category: string;
  tags: readonly string[];
  readingTime: string;
};

export type BlogPost = BlogListing & {
  author: string;
  authorRole: string;
  authorImage: string;
  /** Raw markdown body (preferred for rendering). */
  body?: string;
  /** Structured FAQs for accordion + FAQPage JSON-LD. */
  faqs: BlogFaq[];
  updatedAt?: string;
  /** @deprecated Prefer `body` + MarkdownContent. Kept for transitional admin preview. */
  content: BlogContentBlock[];
};

export function getTableOfContents(
  content: BlogContentBlock[] | string,
  options?: { includeFaq?: boolean }
): { id: string; text: string; level: number }[] {
  if (typeof content === "string") {
    const toc = getMarkdownToc(stripFaqSection(content));
    if (options?.includeFaq) {
      toc.push({ id: "faq", text: "FAQ", level: 2 });
    }
    return toc;
  }
  return content
    .filter((b): b is Extract<BlogContentBlock, { type: "heading" }> => b.type === "heading")
    .map((b) => ({ id: b.id, text: b.text, level: b.level }));
}

export function resolvePostFaqs(body: string, faqs?: unknown): BlogFaq[] {
  const structured = normalizeFaqs(faqs);
  if (structured.length) return structured;
  return extractFaqsFromMarkdown(body);
}

export function resolvePostBody(body: string, faqs: BlogFaq[]): string {
  if (!faqs.length) return body;
  return stripFaqSection(body);
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Coarse block parser - kept for TipTap admin preview fallbacks. Prefer MarkdownContent. */
export function parseBody(md: string): BlogContentBlock[] {
  const blocks: BlogContentBlock[] = [];
  const lines = md.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length as 2 | 3;
      const text = heading[2].trim();
      blocks.push({ type: "heading", id: slugify(text), level, text });
      i += 1;
      continue;
    }

    const image = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      blocks.push({ type: "image", alt: image[1], src: image[2] });
      i += 1;
      continue;
    }

    if (line.trim().startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2).trim());
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("- ") &&
      !lines[i].match(/^#{2,3}\s+/) &&
      !lines[i].trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: para.join(" ") });
  }

  return blocks;
}
