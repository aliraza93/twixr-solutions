"use client";

import Link from "next/link";
import {
  getFeaturedProjects,
  type PortfolioProject,
} from "@/lib/data/portfolio";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SectionHeading } from "@/components/ui/section-heading";
import { ScrollReveal, ScrollRevealItem, ScrollStagger } from "@/components/motion/scroll-reveal";

type FeaturedPortfolioProps = {
  projects?: PortfolioProject[];
  limit?: number;
};

export function FeaturedPortfolio({ projects, limit }: FeaturedPortfolioProps) {
  const items = (projects ?? getFeaturedProjects()).slice(0, limit);

  if (items.length === 0) return null;

  return (
    <section className="bg-surface py-[var(--section-py)]">
      <div className="ds-container">
        <ScrollReveal className="mb-10 md:mb-12">
          <SectionHeading
            align="center"
            eyebrow="Featured"
            title="Flagship Projects"
            emphasis="Projects"
          />
        </ScrollReveal>

        <ScrollStagger className="grid gap-6 lg:grid-cols-2">
          {items.map((project) => (
            <ScrollRevealItem key={project.slug} className="h-full">
              <FeaturedProjectCard project={project} />
            </ScrollRevealItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}

function FeaturedProjectCard({ project }: { project: PortfolioProject }) {
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
        <div className="pointer-events-none absolute left-4 top-4 z-10">
          <Chip
            tabIndex={-1}
            className="cursor-default border-hairline bg-canvas/95 text-ink hover:border-hairline hover:text-ink"
          >
            {project.categoryLabel}
          </Chip>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-7 md:p-8">
        <h3 className="font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em]">
          <Link
            href={`/portfolio/${project.slug}`}
            className="text-ink transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-pine focus-visible:outline-none"
          >
            {project.title}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
          {project.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {project.metrics.map((m) => (
            <div key={m.label} className="rounded-lg border border-hairline bg-surface px-3 py-2">
              <p className="font-sora text-sm font-bold text-ink">{m.value}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                {m.label}
              </p>
            </div>
          ))}
        </div>
        <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
          {project.tags.map((tag) => (
            <li key={tag}>
              <Chip
                tabIndex={-1}
                className="pointer-events-none cursor-default hover:border-hairline hover:text-ink-soft"
              >
                {tag}
              </Chip>
            </li>
          ))}
        </ul>
        <Button variant="text" asChild className="mt-6 self-start">
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
