"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, ExternalLink, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SectionHeading } from "@/components/ui/section-heading";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { getMarkdownToc } from "@/lib/blog/markdown";
import { cn } from "@/lib/utils";
import type { PortfolioCaseStudy, PortfolioProject } from "@/lib/data/portfolio";
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollStagger,
} from "@/components/motion/scroll-reveal";
import { PageCta } from "@/components/sections/page-cta";
import { site } from "@/content/site";

const CONTACT_EMAIL = site.contact.email;

type PortfolioDetailClientProps = {
  project: PortfolioCaseStudy;
  related: PortfolioProject[];
  readingTime: string;
  shareUrl: string;
};

export function PortfolioDetailClient({
  project,
  related,
  readingTime,
  shareUrl,
}: PortfolioDetailClientProps) {
  const body = project.body?.trim() ?? "";
  const toc = useMemo(() => {
    const items = getMarkdownToc(body);
    if (project.outcomes.length) {
      items.push({ id: "results", text: "Results", level: 2 });
    }
    return items;
  }, [body, project.outcomes.length]);
  const [activeId, setActiveId] = useState(toc[0]?.id ?? "");

  useEffect(() => {
    if (!toc.length) return;

    const OFFSET_PX = 112;
    const resolveHeading = (id: string) =>
      document.getElementById(id) ?? document.getElementById(`user-content-${id}`);

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

  const meta = [project.client, project.role, project.timeline, readingTime].filter(Boolean);
  const gallery = (project.gallery.filter(Boolean).length
    ? project.gallery
    : [project.image]
  ).filter(Boolean);

  return (
    <main className="min-h-screen bg-canvas pt-[120px] lg:pt-[140px]">
      <ReadingProgress />
      <div className="ds-container pb-16 md:pb-20">
        <ScrollReveal className="mb-6">
          <Button variant="text" asChild>
            <Link href="/portfolio">
              <ArrowLeft
                aria-hidden
                className="transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:-translate-x-0.5"
              />
              Back to Portfolio
            </Link>
          </Button>
        </ScrollReveal>

        <ScrollReveal>
          <header className="max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Chip
                tabIndex={-1}
                className="pointer-events-none cursor-default hover:border-hairline hover:text-ink-soft"
              >
                {project.categoryLabel}
              </Chip>
              <Chip
                tabIndex={-1}
                className="pointer-events-none cursor-default hover:border-hairline hover:text-ink-soft"
              >
                {project.year}
              </Chip>
            </div>
            <h1 className="font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
              {project.title}
            </h1>
            <p className="mt-4 max-w-[68ch] text-[length:var(--fs-lead)] text-muted">
              {project.longDescription}
            </p>
            <p className="mt-5 font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.14em] text-muted">
              {meta.map((item, index) => (
                <span key={item}>
                  {index > 0 ? <span aria-hidden> · </span> : null}
                  {item}
                </span>
              ))}
            </p>
            <ul className="mt-4 flex list-none flex-wrap gap-1.5 p-0">
              {project.tags.map((tag) => (
                <li key={tag}>
                  <Chip
                    tabIndex={-1}
                    className="pointer-events-none cursor-default px-2 py-0.5 text-[11px] hover:border-hairline hover:text-ink-soft"
                  >
                    {tag}
                  </Chip>
                </li>
              ))}
            </ul>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.06} className="mt-8 lg:mt-10">
          {gallery.length > 0 ? (
            <CaseStudyGallery images={gallery} title={project.title} />
          ) : null}
        </ScrollReveal>

        <section className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-12 lg:gap-10">
          <aside className="lg:col-span-4 lg:col-start-9 lg:row-start-1">
            <div className="space-y-4 lg:sticky lg:top-28">
              <Card variant="base" className="p-5 hover:translate-y-0 sm:p-6">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                  Project overview
                </p>

                <dl className="mt-4 space-y-3 border-b border-hairline pb-4 text-xs sm:text-sm">
                  <div>
                    <dt className="text-muted">Client</dt>
                    <dd className="mt-0.5 font-medium text-ink">{project.client}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Role</dt>
                    <dd className="mt-0.5 font-medium text-ink">{project.role}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Timeline</dt>
                    <dd className="mt-0.5 font-medium text-ink">{project.timeline}</dd>
                  </div>
                </dl>

                {project.metrics.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {project.metrics.map((m) => (
                      <div key={m.label} className="rounded-lg border border-hairline bg-surface px-3 py-2">
                        <p className="font-sora text-sm font-bold text-ink">{m.value}</p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                          {m.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {project.techStack.length > 0 && (
                  <ul className="mt-4 flex list-none flex-wrap gap-1.5 p-0">
                    {project.techStack.map((tech) => (
                      <li key={tech}>
                        <Chip
                          tabIndex={-1}
                          className="pointer-events-none cursor-default px-2 py-0.5 text-[11px] hover:border-hairline hover:text-ink-soft"
                        >
                          {tech}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 space-y-2">
                  <Button variant="primary" className="w-full" asChild>
                    <a href={`mailto:${CONTACT_EMAIL}?subject=Similar project: ${encodeURIComponent(project.title)}`}>
                      Start similar project
                      <span
                        aria-hidden
                        className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                      >
                        →
                      </span>
                    </a>
                  </Button>
                  {project.link && (
                    <Button variant="ghost" className="w-full" asChild>
                      <a href={project.link} target="_blank" rel="noopener noreferrer">
                        Live project
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </Card>

              {toc.length > 0 && (
                <Card variant="base" className="hidden p-5 hover:translate-y-0 lg:block">
                  <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                    On this page
                  </p>
                  <nav aria-label="Case study sections" className="space-y-1">
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

              <Card variant="base" className="hidden p-5 hover:translate-y-0 lg:block">
                <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                  Share
                </p>
                <div className="flex gap-2">
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
                      href={`mailto:?subject=${encodeURIComponent(project.title)}&body=${encodeURIComponent(shareUrl)}`}
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            </div>
          </aside>

          <article className="min-w-0 lg:col-span-8 lg:col-start-1 lg:row-start-1">
            {body ? <MarkdownContent source={body} /> : null}

            {project.outcomes.length > 0 && (
              <div id="results" className="mt-12 scroll-mt-28">
                <div className="band-dark rounded-xl px-6 py-10 md:px-8 md:py-12">
                  <h2 className="font-sora text-[length:var(--fs-h2)] font-extrabold tracking-[-0.02em] text-d-text">
                    Results
                  </h2>
                  <p className="mt-2 max-w-[46ch] text-sm text-d-muted">
                    What this engagement left in production.
                  </p>
                  <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {project.outcomes.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 rounded-lg border border-d-hairline bg-d-bg-2 px-4 py-3"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime" aria-hidden />
                        <span className="text-xs text-d-text sm:text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </article>
        </section>

        {related.length > 0 && (
          <ScrollReveal className="mt-16 md:mt-20">
            <SectionHeading
              align="center"
              eyebrow="More work"
              title="Related projects"
              emphasis="projects"
              className="mb-8"
            />
            <ScrollStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ScrollRevealItem key={p.slug} className="h-full">
                  <RelatedProjectCard project={p} />
                </ScrollRevealItem>
              ))}
            </ScrollStagger>
          </ScrollReveal>
        )}
      </div>
      <PageCta
        title="Want results like this?"
        emphasis="this"
        description="Let's discuss your product goals and build something great together."
        emailSubject="Project inquiry"
        secondaryLabel="View all work"
        secondaryHref="/portfolio"
      />
    </main>
  );
}

function CaseStudyGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const total = images.length;

  const go = (dir: -1 | 1) => {
    setActive((i) => (i + dir + total) % total);
  };

  return (
    <div
      className="outline-none"
      tabIndex={total > 1 ? 0 : undefined}
      onKeyDown={(event) => {
        if (total < 2) return;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          go(1);
        }
      }}
    >
      <div className="relative aspect-16/10 overflow-hidden rounded-lg border border-hairline bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={`${title} screenshot ${active + 1}`}
          className="h-full w-full object-cover"
        />
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2.5 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border border-hairline bg-canvas text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2.5 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border border-hairline bg-canvas text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="absolute bottom-2.5 right-2.5 rounded-md bg-ink px-2 py-0.5 font-mono text-[10px] font-medium text-canvas">
              {active + 1}/{total}
            </span>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="mt-2 flex gap-1.5">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "h-12 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2",
                i === active ? "border-pine" : "border-transparent opacity-70 hover:opacity-100"
              )}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RelatedProjectCard({ project }: { project: PortfolioProject }) {
  return (
    <Card variant="base" className="group flex h-full flex-col overflow-hidden p-0">
      <div className="relative aspect-16/10 overflow-hidden rounded-t-lg">
        <Link
          href={`/portfolio/${project.slug}`}
          className="absolute inset-0"
          tabIndex={-1}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 z-10">
          <Chip
            tabIndex={-1}
            className="cursor-default border-hairline bg-canvas/95 px-2 py-0.5 text-[10px] text-ink hover:border-hairline hover:text-ink"
          >
            {project.categoryLabel}
          </Chip>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-7">
        <h3 className="font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em]">
          <Link
            href={`/portfolio/${project.slug}`}
            className="text-ink transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-pine focus-visible:outline-none"
          >
            {project.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{project.description}</p>
        <Button variant="text" asChild className="mt-4 self-start">
          <Link href={`/portfolio/${project.slug}`}>
            Read case study
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
