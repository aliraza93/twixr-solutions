"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SectionHeading } from "@/components/ui/section-heading";
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
};

export function PortfolioDetailClient({ project, related }: PortfolioDetailClientProps) {
  return (
    <main className="min-h-screen bg-canvas pt-[120px] lg:pt-[140px]">
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

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-6 lg:col-span-2">
            <ScrollReveal>
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
              <SectionHeading
                as="h1"
                align="left"
                title={project.title}
                description={project.longDescription}
              />
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
            </ScrollReveal>

            <ScrollReveal delay={0.06}>
              <CaseStudyGallery images={project.gallery} title={project.title} />
            </ScrollReveal>
          </div>

          <div className="lg:col-span-1">
            <ScrollReveal delay={0.08}>
              <Card variant="base" className="p-5 hover:translate-y-0 lg:sticky lg:top-28 sm:p-6">
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
            </ScrollReveal>
          </div>
        </div>

        <ScrollReveal className="mt-16 md:mt-20">
          <SectionHeading
            align="center"
            eyebrow="Context"
            title="Challenge & solution"
            emphasis="solution"
            className="mb-8"
          />
          <div className="grid gap-6 md:grid-cols-2">
            <Card variant="base">
              <h3 className="mb-3 font-sora text-base font-bold tracking-[-0.02em] text-ink">
                The challenge
              </h3>
              <p className="text-sm leading-relaxed text-muted">{project.challenge}</p>
            </Card>
            <Card variant="feature" className="band-dark">
              <h3 className="mb-3 font-sora text-base font-bold tracking-[-0.02em] text-d-text">
                The solution
              </h3>
              <p className="text-sm leading-relaxed text-d-muted">{project.solution}</p>
            </Card>
          </div>
        </ScrollReveal>

        <div className="mt-16 md:mt-20">
          <div className="band-dark rounded-xl px-6 py-12 md:px-10 md:py-16">
            <SectionHeading
              align="center"
              eyebrow="Results"
              title="Key outcomes"
              emphasis="outcomes"
              description="Measurable impact delivered through this engagement."
              className="mb-8"
            />
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {project.outcomes.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-lg border border-d-hairline bg-surface px-4 py-3"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime" aria-hidden />
                  <span className="text-xs text-d-text sm:text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ScrollReveal className="mt-16 md:mt-20">
          <SectionHeading
            align="center"
            eyebrow="Scope"
            title="What was delivered"
            emphasis="delivered"
            description="End-to-end deliverables included in this project."
            className="mb-8"
          />
          <ScrollStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.deliverables.map((item) => (
              <ScrollRevealItem key={item}>
                <Card variant="base" className="flex items-start gap-2.5 p-4 hover:translate-y-0">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pine" aria-hidden />
                  <span className="text-xs text-ink-soft sm:text-sm">{item}</span>
                </Card>
              </ScrollRevealItem>
            ))}
          </ScrollStagger>
        </ScrollReveal>

        <ScrollReveal className="mt-16 md:mt-20">
          <SectionHeading
            align="center"
            eyebrow="Stack"
            title="Technologies used"
            emphasis="used"
            className="mb-8"
          />
          <ScrollStagger className="flex flex-wrap justify-center gap-2">
            {project.techStack.map((tech) => (
              <ScrollRevealItem key={tech}>
                <Chip
                  tabIndex={-1}
                  className="pointer-events-none cursor-default hover:border-hairline hover:text-ink-soft"
                >
                  {tech}
                </Chip>
              </ScrollRevealItem>
            ))}
          </ScrollStagger>
        </ScrollReveal>

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
    <div>
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
              className="absolute left-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border border-hairline bg-canvas text-ink transition-colors hover:border-ink"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border border-hairline bg-canvas text-ink transition-colors hover:border-ink"
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
                "h-12 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-colors",
                i === active ? "border-pine" : "border-transparent opacity-70 hover:opacity-100"
              )}
              aria-label={`View image ${i + 1}`}
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
            View case study
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
