"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Linkedin, Mail, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { BlogFaqAccordion } from "@/components/blog/faq-accordion";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { cn } from "@/lib/utils";
import type { BlogListing, BlogPost } from "@/lib/data/blog";
import { getTableOfContents, resolvePostBody, resolvePostFaqs } from "@/lib/data/blog";
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollStagger,
} from "@/components/motion/scroll-reveal";

const CONTACT_EMAIL = "ali@twixrsolutions.com";

type BlogDetailClientProps = {
  post: BlogPost;
  related: BlogListing[];
};

export function BlogDetailClient({ post, related }: BlogDetailClientProps) {
  const faqs = useMemo(
    () => resolvePostFaqs(post.body ?? "", post.faqs),
    [post.body, post.faqs]
  );
  const body = useMemo(
    () => resolvePostBody(post.body ?? "", faqs),
    [post.body, faqs]
  );
  const toc = useMemo(
    () => getTableOfContents(body, { includeFaq: faqs.length > 0 }),
    [body, faqs.length]
  );
  const [activeId, setActiveId] = useState(toc[0]?.id ?? "");
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!toc.length) return;

    // Sticky nav (~7rem) + small buffer — last heading above this line is active.
    const OFFSET_PX = 112;

    const resolveHeading = (id: string) =>
      document.getElementById(id) ??
      // Legacy fallback if sanitize still prefixes ids
      document.getElementById(`user-content-${id}`);

    const updateActive = () => {
      let current = toc[0]?.id ?? "";
      for (const item of toc) {
        const el = resolveHeading(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= OFFSET_PX) {
          current = item.id;
        }
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [toc]);

  const shareUrl = `https://www.twixrsolutions.com/blog/${post.slug}`;

  return (
    <main className="min-h-screen bg-canvas pt-[120px] lg:pt-[140px]">
      <ReadingProgress />
      <div className="ds-container pb-16 md:pb-20">
        <ScrollReveal className="mb-6">
          <Button variant="text" asChild>
            <Link href="/blog">
              <ArrowLeft
                aria-hidden
                className="transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:-translate-x-0.5"
              />
              Back to Blog
            </Link>
          </Button>
        </ScrollReveal>

        <ScrollReveal>
          <header className="mx-auto mb-8 max-w-3xl text-center lg:mb-10">
            <div className="mb-5 flex justify-center">
              <Chip
                tabIndex={-1}
                className="pointer-events-none cursor-default hover:border-hairline hover:text-ink-soft"
              >
                {post.category}
              </Chip>
            </div>
            <h1 className="font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
              {post.title}
            </h1>
            <p className="mt-4 font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.14em] text-muted">
              {post.date}
              <span aria-hidden> · </span>
              {post.readingTime}
              <span aria-hidden> · </span>
              {post.author}
            </p>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.05} className="mb-10 overflow-hidden rounded-lg border border-hairline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image}
            alt={`Cover image for ${post.title}`}
            className="aspect-21/9 w-full object-cover"
          />
        </ScrollReveal>

        <section ref={articleRef} className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <article className="min-w-0 lg:col-span-8">
            {/* No ScrollReveal on body/FAQ — tall opacity:0 wrappers caused blank articles until deep scroll. */}
            <MarkdownContent source={body} />

            {faqs.length > 0 && (
              <div className="mt-12">
                <BlogFaqAccordion faqs={faqs} />
              </div>
            )}

            <ul className="mt-10 flex list-none flex-wrap gap-2 p-0">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Chip
                    tabIndex={-1}
                    className="pointer-events-none cursor-default hover:border-hairline hover:text-ink-soft"
                  >
                    #{tag}
                  </Chip>
                </li>
              ))}
            </ul>

            <Card variant="feature" className="mt-10 band-dark px-6 py-8 sm:px-8">
              <h3 className="font-sora text-[length:var(--fs-h2)] font-extrabold tracking-[-0.02em] text-d-text">
                Enjoyed this <span className="text-lime">article</span>?
              </h3>
              <p className="mt-2 max-w-[46ch] text-[length:var(--fs-lead)] text-d-muted">
                Get notified when I publish new posts on SaaS, Laravel, and remote engineering.
              </p>
              <form
                className="mt-4 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => e.preventDefault()}
              >
                <Input
                  type="email"
                  placeholder="you@company.com"
                  className="h-11 flex-1 border-d-hairline bg-surface text-d-text placeholder:text-d-muted focus-visible:ring-lime"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="focus-visible:ring-offset-ink"
                >
                  Subscribe
                </Button>
              </form>
            </Card>
          </article>

          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-28 space-y-4">
              {toc.length > 0 && (
                <Card variant="base" className="p-5 hover:translate-y-0">
                  <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                    On this page
                  </p>
                  <nav aria-label="Table of contents" className="space-y-1">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={cn(
                          "block cursor-pointer rounded-md px-3 py-2 text-sm transition-colors duration-[var(--dur-fast)]",
                          item.level === 3 && "pl-6",
                          activeId === item.id
                            ? "bg-pine-tint font-semibold text-pine"
                            : "text-muted hover:bg-surface hover:text-ink"
                        )}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </Card>
              )}

              <Card variant="base" className="p-5 hover:translate-y-0">
                <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                  Share
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" asChild className="h-10 w-10 rounded-md p-0" aria-label="Share on X">
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" asChild className="h-10 w-10 rounded-md p-0" aria-label="Share on LinkedIn">
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" asChild className="h-10 w-10 rounded-md p-0" aria-label="Share via email">
                    <a
                      href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(shareUrl)}`}
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </Card>

              <Card variant="base" className="p-5 hover:translate-y-0">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.authorImage}
                    alt={post.author}
                    className="h-12 w-12 rounded-full border border-hairline object-cover"
                  />
                  <div>
                    <p className="font-sora text-sm font-semibold text-ink">{post.author}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                      {post.authorRole}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Senior Full Stack Engineer building SaaS products for global clients. Top Rated Plus
                  on Upwork.
                </p>
                <Button variant="ghost" className="mt-4 w-full" asChild>
                  <a href={`mailto:${CONTACT_EMAIL}`}>Get in touch</a>
                </Button>
              </Card>
            </div>
          </aside>
        </section>

        {toc.length > 0 && (
          <ScrollReveal className="mt-8 lg:hidden">
            <Card variant="base" className="p-4 hover:translate-y-0">
              <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                On this page
              </p>
              <div className="flex flex-wrap gap-2">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="rounded-pill border border-hairline bg-canvas px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted hover:border-pine hover:text-pine"
                  >
                    {item.text}
                  </a>
                ))}
              </div>
            </Card>
          </ScrollReveal>
        )}

        {related.length > 0 && (
          <ScrollReveal className="mt-14 md:mt-16">
            <SectionHeading
              align="center"
              eyebrow="Keep reading"
              title="More posts"
              emphasis="posts"
              className="mb-8"
            />
            <ScrollStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ScrollRevealItem key={p.slug} className="h-full">
                  <RelatedPostCard post={p} />
                </ScrollRevealItem>
              ))}
            </ScrollStagger>
          </ScrollReveal>
        )}
      </div>
    </main>
  );
}

function RelatedPostCard({ post }: { post: BlogListing }) {
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
            src={post.image}
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
