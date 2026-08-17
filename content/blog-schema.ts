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
