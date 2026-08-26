"use client";

import Image from "next/image";
import Link from "next/link";
import { type BlogListing } from "@/lib/data/blog";
import { insights } from "@/content/insights";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollReveal, ScrollRevealItem, ScrollStagger } from "@/components/motion/scroll-reveal";
import { cn } from "@/lib/utils";

export function BlogPosts({ posts }: { posts: BlogListing[] }) {
  const [featured, ...rest] = posts;

  return (
    <section
      id="insights"
      className="relative overflow-x-hidden bg-canvas py-[var(--section-py)]"
    >
      <div className="ds-container">
        <ScrollReveal>
          <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
            <div className="max-w-[40rem]">
              <Eyebrow>{insights.eyebrow}</Eyebrow>
              <h2 className="mt-5 font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
                {insights.headingBefore}{" "}
                <span className="text-pine">{insights.headingEmphasis}</span>
              </h2>
              <p className="mt-5 max-w-[62ch] text-[length:var(--fs-lead)] text-muted">
                {insights.lead}
              </p>
            </div>
            <Button asChild variant="text" className="self-start md:self-end md:mb-1">
              <Link href={insights.viewAll.href}>
                {insights.viewAll.label}
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                >
                  →
                </span>
              </Link>
            </Button>
          </header>
        </ScrollReveal>

        <ScrollStagger className="mt-12 flex flex-col gap-6 md:mt-16 md:gap-8">
          {featured && (
            <ScrollRevealItem>
              <InsightCard post={featured} featured />
            </ScrollRevealItem>
          )}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {rest.map((post) => (
              <ScrollRevealItem key={post.slug} className="h-full">
                <InsightCard post={post} />
              </ScrollRevealItem>
            ))}
          </div>
        </ScrollStagger>
      </div>
    </section>
  );
}

function InsightCard({
  post,
  featured = false,
}: {
  post: BlogListing;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      aria-label={post.title}
      className={cn(
        "group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        featured ? "rounded-xl" : "rounded-lg"
      )}
    >
      <Card
        variant={featured ? "feature" : "base"}
        className={cn(
          "insight-card h-full overflow-hidden p-0",
          featured && "hover:-translate-y-0.5"
        )}
      >
        <div
          className={cn(
            featured && "md:grid md:grid-cols-2 md:items-stretch"
          )}
        >
          <div
            className={cn(
              "insight-card__media relative overflow-hidden",
              featured
                ? "aspect-[16/10] md:aspect-auto md:h-full md:min-h-[320px]"
                : "aspect-[16/10]"
            )}
          >
            <Image
              src={post.image || "/og-image.png"}
              alt=""
              fill
              sizes={
                featured
                  ? "(min-width: 768px) 50vw, 100vw"
                  : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              }
              className="object-cover"
            />
          </div>

          <div
            className={cn(
              "flex flex-col p-7 md:p-8",
              featured && "md:justify-center md:p-10"
            )}
          >
            <p
              className={cn(
                "font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.14em]",
                featured ? "text-d-muted" : "text-muted"
              )}
            >
              {post.category}
              <span aria-hidden> · </span>
              {post.date}
            </p>
            <h3
              className={cn(
                "mt-3 font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                featured
                  ? "text-d-text group-hover:text-lime"
                  : "text-ink group-hover:text-pine"
              )}
            >
              {post.title}
            </h3>
            <p
              className={cn(
                "mt-3 line-clamp-3 text-sm leading-relaxed",
                featured ? "text-d-muted" : "text-muted"
              )}
            >
              {post.excerpt}
            </p>
            <span
              className={cn(
                "mt-6 inline-flex items-center gap-1.5 text-sm font-semibold",
                featured ? "text-lime" : "text-pine"
              )}
            >
              Read
              <span
                aria-hidden
                className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
              >
                →
              </span>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
