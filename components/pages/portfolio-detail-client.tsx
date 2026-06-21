"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PortfolioCaseStudy, PortfolioProject } from "@/lib/data/portfolio";
import { GsapReveal, GsapStagger, GsapStaggerItem } from "@/components/motion/gsap-reveal";

const CONTACT_EMAIL = "ali@twixrsolutions.com";

type PortfolioDetailClientProps = {
  project: PortfolioCaseStudy;
  related: PortfolioProject[];
};

function SectionHeading({
  badge,
  title,
  highlight,
  description,
}: {
  badge?: string;
  title: string;
  highlight?: string;
  description?: string;
}) {
  return (
    <div className="mb-5 text-center md:mb-6">
      {badge && (
        <span className="mb-3 inline-block rounded-full bg-primary/5 px-4 py-1 text-[20px] font-bold uppercase tracking-[0.2em] text-primary dark:bg-primary/10">
          {badge}
        </span>
      )}
      <h2 className="text-section-title font-semibold text-slate-900 dark:text-white">
        {title && <span className="font-semibold">{title} </span>}
        {highlight && <span className="font-black italic text-primary">{highlight}</span>}
      </h2>
      {description && <p className="text-section-desc mx-auto mt-3">{description}</p>}
    </div>
  );
}

export function PortfolioDetailClient({ project, related }: PortfolioDetailClientProps) {
  return (
    <main className="min-h-screen bg-background pt-[120px] lg:pt-[140px]">
      <div className="container mx-auto max-w-6xl px-4 pb-16 md:pb-20">
        <GsapReveal className="mb-5">
          <Link
            href="/portfolio"
            className="group inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Portfolio
          </Link>
        </GsapReveal>

        {/* Hero + sidebar */}
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-5 lg:col-span-2">
            <GsapReveal>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {project.categoryLabel}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">{project.year}</span>
              </div>
              <h1 className="text-page-title text-slate-900 dark:text-white">{project.title}</h1>
              <p className="text-lead mt-2 text-sm">{project.longDescription}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md border border-slate-200/90 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </GsapReveal>

            <GsapReveal delay={0.06}>
              <CaseStudyGallery images={project.gallery} title={project.title} />
            </GsapReveal>
          </div>

          <div className="lg:col-span-1">
            <GsapReveal delay={0.08}>
              <aside className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm lg:sticky lg:top-28 dark:border-slate-700/90 dark:bg-slate-950/60 sm:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Project overview
                </p>

                <dl className="mt-4 space-y-3 border-b border-border pb-4 text-xs sm:text-sm">
                  <div>
                    <dt className="text-muted-foreground">Client</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{project.client}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Role</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{project.role}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Timeline</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{project.timeline}</dd>
                  </div>
                </dl>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {project.metrics.map((m) => (
                    <div
                      key={m.label}
                      className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/80"
                    >
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{m.value}</p>
                      <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  <Button
                    size="lg"
                    className="h-10 w-full cursor-pointer rounded-full text-sm font-bold shadow-md shadow-primary/10"
                    asChild
                  >
                    <a href={`mailto:${CONTACT_EMAIL}?subject=Similar project: ${encodeURIComponent(project.title)}`}>
                      Start similar project
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  {project.link && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-10 w-full cursor-pointer rounded-full border-slate-200 text-sm dark:border-slate-700"
                      asChild
                    >
                      <a href={project.link} target="_blank" rel="noopener noreferrer">
                        Live project
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </aside>
            </GsapReveal>
          </div>
        </div>

        {/* Challenge & Solution */}
        <GsapReveal as="section" className="mt-12 md:mt-14">
          <SectionHeading badge="Context" title="Challenge &" highlight="solution" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 dark:border-slate-700 dark:bg-slate-950/50 sm:p-6">
              <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-white">The challenge</h3>
              <p className="text-sm leading-normal text-slate-600 dark:text-slate-400">{project.challenge}</p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 dark:bg-primary/10 sm:p-6">
              <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-white">The solution</h3>
              <p className="text-sm leading-normal text-slate-600 dark:text-slate-400">{project.solution}</p>
            </div>
          </div>
        </GsapReveal>

        {/* Outcomes */}
        <GsapReveal as="section" className="mt-12 md:mt-14">
          <SectionHeading
            badge="Results"
            title="Key"
            highlight="outcomes"
            description="Measurable impact delivered through this engagement."
          />
          <GsapStagger className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {project.outcomes.map((item) => (
              <GsapStaggerItem key={item}>
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/40">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                  <span className="text-xs text-slate-700 sm:text-sm dark:text-slate-300">{item}</span>
                </div>
              </GsapStaggerItem>
            ))}
          </GsapStagger>
        </GsapReveal>

        {/* Deliverables */}
        <GsapReveal as="section" className="mt-12 md:mt-14">
          <SectionHeading
            badge="Scope"
            title="What was"
            highlight="delivered"
            description="End-to-end deliverables included in this project."
          />
          <GsapStagger className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {project.deliverables.map((item) => (
              <GsapStaggerItem key={item}>
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/40">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="text-xs text-slate-700 sm:text-sm dark:text-slate-300">{item}</span>
                </div>
              </GsapStaggerItem>
            ))}
          </GsapStagger>
        </GsapReveal>

        {/* Tech stack */}
        <GsapReveal as="section" className="mt-12 md:mt-14">
          <SectionHeading badge="Stack" title="Technologies" highlight="used" />
          <GsapStagger className="flex flex-wrap justify-center gap-2">
            {project.techStack.map((tech) => (
              <GsapStaggerItem key={tech}>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {tech}
                </span>
              </GsapStaggerItem>
            ))}
          </GsapStagger>
        </GsapReveal>

        {/* Related projects */}
        {related.length > 0 && (
          <GsapReveal as="section" className="mt-12 md:mt-14">
            <SectionHeading badge="More work" title="Related" highlight="projects" />
            <GsapStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <GsapStaggerItem key={p.slug}>
                  <RelatedProjectCard project={p} />
                </GsapStaggerItem>
              ))}
            </GsapStagger>
          </GsapReveal>
        )}

        {/* CTA */}
        <GsapReveal as="section" className="mt-12 md:mt-14">
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40 sm:px-10">
            <h2 className="text-section-title text-slate-900 dark:text-white">
              Want results like <span className="font-black italic text-primary">this</span>?
            </h2>
            <p className="text-section-desc mx-auto mt-3">
              Let&apos;s discuss your product goals and build something great together.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="h-10 cursor-pointer rounded-full px-6 text-sm font-bold"
                asChild
              >
                <a href={`mailto:${CONTACT_EMAIL}?subject=Project inquiry`}>
                  Start a Project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-10 cursor-pointer rounded-full border-slate-200 px-6 text-sm font-bold dark:border-slate-700"
                asChild
              >
                <Link href="/portfolio">View all work</Link>
              </Button>
            </div>
          </div>
        </GsapReveal>
      </div>
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
      <div className="relative aspect-16/10 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
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
              className="absolute left-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm transition-colors hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm transition-colors hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
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
                "h-12 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-colors",
                i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              )}
              aria-label={`View image ${i + 1}`}
            >
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
    <Link
      href={`/portfolio/${project.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white transition-all hover:border-primary/25 hover:shadow-md dark:border-slate-700 dark:bg-slate-950/50"
    >
      <div className="relative aspect-16/10 overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800 backdrop-blur-sm">
            {project.categoryLabel}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{project.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600 dark:text-slate-400">
          {project.description}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-all group-hover:gap-2.5">
          View case study
          <Icon icon="lucide:arrow-right" className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
