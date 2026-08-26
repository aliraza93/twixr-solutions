"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { type BlogListing } from "@/lib/data/blog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FilterChip } from "@/components/ui/filter-chip";
import { PageHero } from "@/components/sections/page-hero";
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollStagger,
} from "@/components/motion/scroll-reveal";

export function BlogPageClient({
  posts,
  categories,
}: {
  posts: BlogListing[];
  categories: { id: string; label: string; count: number }[];
}) {
  return (
    <main className="min-h-screen bg-canvas pt-[120px] lg:pt-[140px]">
      <PageHero
        eyebrow="INSIGHTS"
        title="Ali's Blog"
        emphasis="Blog"
        description="Insights on software engineering, SaaS architecture, remote work, and building products that scale."
      />
      <BlogCatalog posts={posts} categories={categories} />
    </main>
  );
}

function BlogCatalog({
  posts,
  categories,
}: {
  posts: BlogListing[];
  categories: { id: string; label: string; count: number }[];
}) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() => {
    if (activeCategory === "all") return posts;
    return posts.filter((p) => p.category === activeCategory);
  }, [posts, activeCategory]);

  return (
    <section className="bg-canvas pb-16 md:pb-20">
      <div className="ds-container">
        <ScrollReveal className="mb-8 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <FilterChip
              key={cat.id}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.id === "all" && <LayoutGrid className="h-3.5 w-3.5" />}
              {cat.label}
              <span
                className={cn(
                  "rounded-pill px-1.5 py-0.5 font-mono text-[10px]",
                  activeCategory === cat.id
                    ? "bg-canvas/20 text-canvas"
                    : "bg-surface text-muted"
                )}
              >
                {cat.count}
              </span>
            </FilterChip>
          ))}
        </ScrollReveal>

        {filtered.length === 0 ? (
          <ScrollReveal className="rounded-lg border border-dashed border-hairline py-16 text-center">
            <p className="text-sm text-muted">No posts in this category yet.</p>
          </ScrollReveal>
        ) : (
          <ScrollStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <ScrollRevealItem key={post.slug} className="h-full">
                <InsightCard post={post} />
              </ScrollRevealItem>
            ))}
          </ScrollStagger>
        )}
      </div>
    </section>
  );
}

function InsightCard({ post }: { post: BlogListing }) {
  return (
    <Card variant="base" className="insight-card group h-full overflow-hidden p-0">
      <div className="insight-card__media relative aspect-[16/10] overflow-hidden rounded-t-lg">
        <Link
          href={`/blog/${post.slug}`}
          className="absolute inset-0"
          tabIndex={-1}
          aria-hidden
        >
          <Image
            src={post.image || "/og-image.png"}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </Link>
      </div>

      <div className="flex flex-col p-7 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Chip
            tabIndex={-1}
            className="pointer-events-none cursor-default px-2 py-0.5 text-[10px] hover:border-hairline hover:text-ink-soft"
          >
            {post.category}
          </Chip>
          <p className="font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.14em] text-muted">
            {post.date}
            <span aria-hidden> · </span>
            {post.readingTime}
          </p>
        </div>
        <h3 className="mt-3 font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em]">
          <Link
            href={`/blog/${post.slug}`}
            className="text-ink transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-pine focus-visible:outline-none group-hover:text-pine"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
          {post.excerpt}
        </p>
        <Button variant="text" asChild className="mt-6 self-start">
          <Link href={`/blog/${post.slug}`}>
            Read
            <span
              aria-hidden
              className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
            >
              →
            </span>
          </Link>
        </Button>
      </div>
    </Card>
  );
}
