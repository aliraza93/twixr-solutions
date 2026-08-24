import { cache } from "react";
import {
  getBlogBySlug as fileBySlug,
  getBlogCategories as fileCategories,
  getBlogListings as fileListings,
  getBlogSlugs as fileSlugs,
} from "@/content/blog";
import { parseBody, resolvePostFaqs } from "@/content/blog-schema";
import type { BlogListing, BlogPost, BlogPostRecord } from "@/lib/cms/types";
import { prisma, requireDb, withDb } from "@/lib/cms/db";
import { isPersistedId } from "@/lib/cms/utils";
import type { BlogPost as PrismaBlogPost } from "@prisma/client";

function toRecord(row: PrismaBlogPost): BlogPostRecord {
  const faqs = resolvePostFaqs(row.body, row.faqs);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    date: row.date,
    image: row.image,
    category: row.category,
    tags: row.tags,
    readingTime: row.readingTime,
    author: row.author,
    authorRole: row.authorRole,
    authorImage: row.authorImage,
    body: row.body,
    faqs,
    published: row.published,
    order: row.sortOrder,
    updatedAt: row.updatedAt.toISOString(),
    content: parseBody(row.body),
  };
}

function listingOf(post: BlogPost): BlogListing {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date,
    image: post.image,
    category: post.category,
    tags: post.tags,
    readingTime: post.readingTime,
  };
}

async function loadPublished(): Promise<BlogPostRecord[] | null> {
  return withDb(async () => {
    const rows = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.length ? rows.map(toRecord) : null;
  }, null);
}

export const getBlogListings = cache(async (): Promise<BlogListing[]> => {
  const rows = await loadPublished();
  if (!rows) return fileListings();
  return rows.map(listingOf);
});

export const getBlogSlugs = cache(async (): Promise<string[]> => {
  const rows = await loadPublished();
  if (!rows) return fileSlugs();
  return rows.map((row) => row.slug);
});

export const getBlogBySlug = cache(async (slug: string): Promise<BlogPost | undefined> => {
  const fromDb = await withDb(async () => {
    const row = await prisma.blogPost.findFirst({
      where: { slug, published: true },
    });
    return row ? toRecord(row) : null;
  }, null);
  return fromDb ?? fileBySlug(slug);
});

export async function getBlogCategories() {
  const listings = await getBlogListings();
  if (!(await loadPublished())) return fileCategories();

  const counts = new Map<string, number>();
  for (const post of listings) {
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  }
  return [
    { id: "all", label: "All", count: listings.length },
    ...Array.from(counts.entries()).map(([id, count]) => ({ id, label: id, count })),
  ];
}

export async function getRelatedPosts(slug: string, limit = 3): Promise<BlogListing[]> {
  const current = await getBlogBySlug(slug);
  const all = (await getBlogListings()).filter((p) => p.slug !== slug);
  if (!current) return all.slice(0, limit);
  const sameCategory = all.filter((p) => p.category === current.category);
  return (sameCategory.length >= limit ? sameCategory : all).slice(0, limit);
}

export async function listBlogPostsAdmin(): Promise<BlogPostRecord[]> {
  return withDb(async () => {
    const rows = await prisma.blogPost.findMany({ orderBy: { sortOrder: "asc" } });
    if (!rows.length) return fallbackAdminPosts();
    return rows.map(toRecord);
  }, fallbackAdminPosts());
}

function fallbackAdminPosts(): BlogPostRecord[] {
  return fileListings().map((listing, index) => {
    const post = fileBySlug(listing.slug);
    return {
      id: listing.slug,
      ...listing,
      author: post?.author ?? "Twixr Solutions",
      authorRole: post?.authorRole ?? "",
      authorImage: post?.authorImage ?? "",
      content: post?.content ?? [],
      body: post?.body ?? "",
      faqs: post?.faqs ?? [],
      published: true,
      order: index + 1,
    };
  });
}

export async function getBlogPostAdmin(id: string): Promise<BlogPostRecord | null> {
  const byId = await withDb(async () => {
    const row = await prisma.blogPost.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }, null);
  if (byId) return byId;

  const bySlug = await withDb(async () => {
    const row = await prisma.blogPost.findUnique({ where: { slug: id } });
    return row ? toRecord(row) : null;
  }, null);
  if (bySlug) return bySlug;

  const file = fileBySlug(id);
  if (!file) return null;
  return {
    id: file.slug,
    ...file,
    body: file.body ?? "",
    faqs: file.faqs ?? [],
    published: true,
    order: 0,
  };
}

export async function upsertBlogPost(
  input: Omit<BlogPostRecord, "id" | "content"> & { id?: string }
) {
  const db = requireDb();
  const data = {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    date: input.date,
    image: input.image,
    category: input.category,
    tags: [...input.tags],
    readingTime: input.readingTime,
    author: input.author,
    authorRole: input.authorRole,
    authorImage: input.authorImage,
    body: input.body,
    faqs: input.faqs ?? [],
    published: input.published,
    sortOrder: input.order,
  };

  if (isPersistedId(input.id)) {
    await db.blogPost.update({ where: { id: input.id }, data });
    return input.id;
  }

  const created = await db.blogPost.upsert({
    where: { slug: input.slug },
    create: data,
    update: data,
  });
  return created.id;
}

export async function deleteBlogPost(id: string) {
  const db = requireDb();
  await db.blogPost.delete({ where: { id } });
}
