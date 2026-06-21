"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getBlogCategories,
  getBlogListings,
  type BlogListing,
} from "@/lib/data/blog";
import { GsapReveal, GsapStagger, GsapStaggerItem } from "@/components/motion/gsap-reveal";

export function BlogPageClient() {
  const posts = getBlogListings();
  const categories = getBlogCategories();

  return (
    <main className="min-h-screen bg-background pt-[120px] lg:pt-[140px]">
      <BlogHero />
      <BlogCatalog posts={posts} categories={categories} />
    </main>
  );
}

function BlogHero() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-hero-item]"),
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out" }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative overflow-hidden bg-white pb-10 pt-6 lg:pb-14 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.1)_0,transparent_60%)] blur-[80px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.28] dark:opacity-15" />
      </div>

      <div ref={ref} className="container relative z-10 mx-auto max-w-3xl px-4 text-center">
        <span
          data-hero-item
          className="mb-5 inline-block rounded-full bg-primary/5 px-4 py-1 text-[20px] font-bold uppercase tracking-[0.2em] text-primary dark:bg-primary/10"
        >
          Insights
        </span>
        <h1 data-hero-item className="text-display font-medium text-slate-900 dark:text-white">
          Ali&apos;s <span className="font-black italic text-primary">Blog</span>
        </h1>
        <p data-hero-item className="text-section-desc mx-auto mt-4">
          Insights on software engineering, SaaS architecture, remote work, and building products
          that scale.
        </p>
      </div>
    </section>
  );
}

function BlogCatalog({
  posts,
  categories,
}: {
  posts: BlogListing[];
  categories: ReturnType<typeof getBlogCategories>;
}) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() => {
    if (activeCategory === "all") return posts;
    return posts.filter((p) => p.category === activeCategory);
  }, [posts, activeCategory]);

  return (
    <section className="pb-16 md:pb-20">
      <div className="container mx-auto max-w-6xl px-4">
        <GsapReveal className="mb-8 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                activeCategory === cat.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              )}
            >
              {cat.id === "all" && <LayoutGrid className="h-3.5 w-3.5" />}
              {cat.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  activeCategory === cat.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                )}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </GsapReveal>

        {filtered.length === 0 ? (
          <GsapReveal className="rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
            <p className="text-sm text-muted-foreground">No posts in this category yet.</p>
          </GsapReveal>
        ) : (
          <GsapStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <GsapStaggerItem key={post.slug}>
                <BlogGridCard post={post} />
              </GsapStaggerItem>
            ))}
          </GsapStagger>
        )}
      </div>
    </section>
  );
}

function BlogGridCard({ post }: { post: BlogListing }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white transition-all hover:border-primary/25 hover:shadow-md dark:border-slate-700 dark:bg-slate-950/50"
    >
      <div className="relative aspect-16/10 overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800 backdrop-blur-sm dark:bg-slate-900/90 dark:text-white">
          {post.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
      <h2 className="text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-primary dark:text-white sm:text-lg">
        {post.title}
      </h2>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-normal text-slate-600 dark:text-slate-400">
        {post.excerpt}
      </p>
      <p className="mt-4 text-xs font-medium text-muted-foreground">
        {post.date} · {post.readingTime}
      </p>
      </div>
    </Link>
  );
}
