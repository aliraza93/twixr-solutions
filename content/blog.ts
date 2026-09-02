import fs from "node:fs";
import path from "node:path";
import type { BlogListing, BlogPost } from "./blog-schema";
import { parseBody, resolvePostFaqs } from "./blog-schema";
import { pickRelatedPosts } from "@/lib/pipeline/seo/related";

export type { BlogContentBlock, BlogListing, BlogPost } from "./blog-schema";
export {
  getTableOfContents,
  parseBody,
  resolvePostBody,
  resolvePostFaqs,
} from "./blog-schema";

type Frontmatter = Record<string, string>;

function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw.trim() };

  const data: Frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body: match[2].trim() };
}

function parsePost(raw: string): BlogPost {
  const { data, body } = parseFrontmatter(raw);
  const tags = (data.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const faqs = resolvePostFaqs(body);
  return {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    date: data.date,
    image: data.image,
    category: data.category,
    tags,
    readingTime: data.readingTime,
    author: data.author,
    authorRole: data.authorRole,
    authorImage: data.authorImage,
    body,
    faqs,
    content: parseBody(body),
  };
}

function loadPosts(): BlogPost[] {
  const dir = path.join(process.cwd(), "content", "blog");
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data } = parseFrontmatter(raw);
      return {
        order: Number.parseInt(data.order ?? "99", 10),
        post: parsePost(raw),
      };
    })
    .sort((a, b) => {
      const dateCmp = b.post.date.localeCompare(a.post.date);
      if (dateCmp !== 0) return dateCmp;
      return b.order - a.order;
    })
    .map(({ post }) => post);
}

let cache: BlogPost[] | null = null;

function posts() {
  if (!cache) cache = loadPosts();
  return cache;
}

export function getBlogListings(): BlogListing[] {
  return posts().map(({ content, author, authorRole, authorImage, ...listing }) => listing);
}

export function getBlogSlugs(): string[] {
  return posts().map((p) => p.slug);
}

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return posts().find((p) => p.slug === slug);
}

export function getBlogCategories(): { id: string; label: string; count: number }[] {
  const all = posts();
  const counts = new Map<string, number>();
  for (const post of all) {
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  }
  return [
    { id: "all", label: "All", count: all.length },
    ...Array.from(counts.entries()).map(([id, count]) => ({
      id,
      label: id,
      count,
    })),
  ];
}

export function getRelatedPosts(slug: string, limit = 3): BlogListing[] {
  const current = getBlogBySlug(slug);
  const all = getBlogListings().filter((p) => p.slug !== slug);
  if (!current) return all.slice(0, limit);
  return pickRelatedPosts(current, all, limit);
}
