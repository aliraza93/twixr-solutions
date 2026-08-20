export type BlogContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; id: string; level: 2 | 3; text: string }
  | { type: "list"; items: string[] };

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
  content: BlogContentBlock[];
};

export function getTableOfContents(
  content: BlogContentBlock[]
): { id: string; text: string; level: number }[] {
  return content
    .filter((b): b is Extract<BlogContentBlock, { type: "heading" }> => b.type === "heading")
    .map((b) => ({ id: b.id, text: b.text, level: b.level }));
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
      !lines[i].match(/^#{2,3}\s+/)
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: para.join(" ") });
  }

  return blocks;
}
