"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Linkedin,
  Mail,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BlogContentBlock, BlogListing, BlogPost } from "@/lib/data/blog";
import { getTableOfContents } from "@/lib/data/blog";
import { GsapReveal, GsapStagger, GsapStaggerItem } from "@/components/motion/gsap-reveal";

const CONTACT_EMAIL = "ali@twixrsolutions.com";

type BlogDetailClientProps = {
  post: BlogPost;
  related: BlogListing[];
};

export function BlogDetailClient({ post, related }: BlogDetailClientProps) {
  const toc = getTableOfContents(post.content);
  const [activeId, setActiveId] = useState(toc[0]?.id ?? "");
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const headings = toc.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    headings.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [toc]);

  const shareUrl = `https://twixrsolutions.com/blog/${post.slug}`;

  return (
    <main className="min-h-screen bg-background pt-[120px] lg:pt-[140px]">
      <div className="container mx-auto max-w-6xl px-4 pb-16 md:pb-20">
        <GsapReveal className="mb-6">
          <Link
            href="/blog"
            className="group inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Blog
          </Link>
        </GsapReveal>

        <GsapReveal>
          <header className="mx-auto mb-8 max-w-3xl text-center lg:mb-10">
            <span className="mb-3 inline-block rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {post.category}
            </span>
            <h1 className="text-page-title text-slate-900 dark:text-white">{post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {post.date}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {post.readingTime}
              </span>
              <span>By {post.author}</span>
            </div>
          </header>
        </GsapReveal>

        <GsapReveal delay={0.05} className="mb-10 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <img
            src={post.image}
            alt={post.title}
            className="aspect-21/9 w-full object-cover"
          />
        </GsapReveal>

        {/* Article + sticky sidebar — sidebar sticks until this section ends */}
        <section ref={articleRef} className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <article className="min-w-0 lg:col-span-8">
            <GsapReveal>
              <div className="prose-blog space-y-5">
                <BlogContent blocks={post.content} />
              </div>
            </GsapReveal>

            <GsapReveal className="mt-10">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </GsapReveal>

            <GsapReveal className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 dark:bg-primary/10 sm:p-8">
              <h3 className="text-section-title text-slate-900 dark:text-white">
                Enjoyed this <span className="font-black italic text-primary">article</span>?
              </h3>
              <p className="text-section-desc mt-2">
                Get notified when I publish new posts on SaaS, Laravel, and remote engineering.
              </p>
              <form
                className="mt-4 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => e.preventDefault()}
              >
                <Input
                  type="email"
                  placeholder="you@company.com"
                  className="h-10 flex-1 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
                />
                <Button type="submit" className="h-10 cursor-pointer rounded-full px-6 font-bold">
                  Subscribe
                </Button>
              </form>
            </GsapReveal>
          </article>

          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-28 space-y-4">
              {toc.length > 0 && (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/60">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    On this page
                  </p>
                  <nav className="space-y-1">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={cn(
                          "block cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors",
                          item.level === 3 && "pl-6",
                          activeId === item.id
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                        )}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/60">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Share
                </p>
                <div className="flex gap-2">
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-400"
                    aria-label="Share on X"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-400"
                    aria-label="Share on LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(shareUrl)}`}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-400"
                    aria-label="Share via email"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorImage}
                    alt={post.author}
                    className="h-12 w-12 rounded-full border border-slate-100 object-cover dark:border-slate-700"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{post.author}</p>
                    <p className="text-xs text-muted-foreground">{post.authorRole}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-normal text-slate-600 dark:text-slate-400">
                  Senior Full Stack Engineer building SaaS products for global clients. Top Rated Plus
                  on Upwork.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 h-9 w-full cursor-pointer rounded-full text-xs font-bold"
                  asChild
                >
                  <a href={`mailto:${CONTACT_EMAIL}`}>Get in touch</a>
                </Button>
              </div>
            </div>
          </aside>
        </section>

        {/* Mobile TOC */}
        {toc.length > 0 && (
          <GsapReveal className="mt-8 lg:hidden">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                On this page
              </p>
              <div className="flex flex-wrap gap-2">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                  >
                    {item.text}
                  </a>
                ))}
              </div>
            </div>
          </GsapReveal>
        )}

        {related.length > 0 && (
          <GsapReveal as="section" className="mt-14 md:mt-16">
            <div className="mb-6 text-center">
              <span className="mb-3 inline-block rounded-full bg-primary/5 px-4 py-1 text-[20px] font-bold uppercase tracking-[0.2em] text-primary dark:bg-primary/10">
                Keep reading
              </span>
              <h2 className="text-section-title font-semibold text-slate-900 dark:text-white">
                More <span className="font-black italic text-primary">posts</span>
              </h2>
            </div>
            <GsapStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <GsapStaggerItem key={p.slug}>
                  <RelatedPostCard post={p} />
                </GsapStaggerItem>
              ))}
            </GsapStagger>
          </GsapReveal>
        )}
      </div>
    </main>
  );
}

function BlogContent({ blocks }: { blocks: BlogContentBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "paragraph") {
          return (
            <p key={i} className="text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
              {block.text}
            </p>
          );
        }
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h2" : "h3";
          return (
            <Tag
              key={block.id}
              id={block.id}
              className={cn(
                "scroll-mt-28 font-bold tracking-tight text-slate-900 dark:text-white",
                block.level === 2 ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
              )}
            >
              {block.text}
            </Tag>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="space-y-2 pl-1">
              {block.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return null;
      })}
    </>
  );
}

function RelatedPostCard({ post }: { post: BlogListing }) {
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
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {post.date}
        </p>
        <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">{post.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600 dark:text-slate-400">
          {post.excerpt}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-all group-hover:gap-2.5">
          Read article
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
