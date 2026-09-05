"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FilterChip } from "@/components/ui/filter-chip";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  portfolioCategories,
  type PortfolioCategoryId,
  type PortfolioProject,
} from "@/lib/data/portfolio";
import { FeaturedPortfolio } from "@/components/sections/featured-portfolio";
import { PageCta } from "@/components/sections/page-cta";
import { PageHero } from "@/components/sections/page-hero";
import { StatsStrip } from "@/components/sections/stats-strip";
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollStagger,
} from "@/components/motion/scroll-reveal";

export function PortfolioPageClient({
  projects,
  featured,
}: {
  projects: PortfolioProject[];
  featured?: PortfolioProject[];
}) {

  return (
    <main className="min-h-screen bg-canvas pt-[120px] lg:pt-[140px]">
      <PageHero
        eyebrow="SELECTED WORK"
        title="Product Portfolio"
        emphasis="Portfolio"
        description="SaaS platforms, APIs, and cloud-native products built for startups and global teams - from MVP to scale."
      />
      <FeaturedPortfolio projects={featured} />
      <ProjectCatalog projects={projects} />
      <StatsStrip />
      <PageCta
        title="Ready to build your next product?"
        emphasis="next product"
        description="Let's turn your idea into a scalable SaaS or web application."
        emailSubject="New project inquiry"
        secondaryLabel="View Services"
        secondaryHref="/services"
      />
    </main>
  );
}

function ProjectCatalog({ projects }: { projects: PortfolioProject[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | PortfolioCategoryId>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesCategory = activeCategory === "all" || p.categoryId === activeCategory;
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [projects, query, activeCategory]);

  return (
    <section className="bg-canvas py-[var(--section-py)]">
      <div className="ds-container">
        <ScrollReveal className="mb-8 md:mb-10">
          <SectionHeading
            align="center"
            eyebrow="Catalog"
            title="All Projects"
            emphasis="Projects"
            description="Filter by category or search the stack - case studies across SaaS, web, and cloud."
          />
        </ScrollReveal>

        <ScrollReveal delay={0.05} className="mb-8">
          <Card variant="base" className="p-4 hover:translate-y-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects, stacks, keywords…"
                  className="h-10 border-hairline bg-canvas pl-10 pr-10 text-sm text-ink shadow-none placeholder:text-muted focus-visible:border-pine focus-visible:ring-pine"
                  aria-label="Search projects"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted hover:text-ink"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {portfolioCategories.map((cat) => (
                  <FilterChip
                    key={cat.id}
                    active={activeCategory === cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.id === "all" && <LayoutGrid className="h-3.5 w-3.5" />}
                    {cat.label}
                  </FilterChip>
                ))}
              </div>
            </div>
          </Card>
        </ScrollReveal>

        {filtered.length === 0 ? (
          <ScrollReveal className="rounded-lg border border-dashed border-hairline py-16 text-center">
            <p className="text-sm text-muted">No projects match your filters.</p>
          </ScrollReveal>
        ) : (
          <ScrollStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <ScrollRevealItem key={project.slug} className="h-full">
                <ProjectCard project={project} />
              </ScrollRevealItem>
            ))}
          </ScrollStagger>
        )}
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: PortfolioProject }) {
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
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            {project.year}
          </p>
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            {project.client}
          </p>
        </div>
        <h3 className="font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em]">
          <Link
            href={`/portfolio/${project.slug}`}
            className="text-ink transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-pine focus-visible:outline-none"
          >
            {project.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
          {project.description}
        </p>
        <ul className="mt-3 flex list-none flex-wrap gap-1.5 p-0">
          {project.tags.slice(0, 3).map((tag) => (
            <li key={tag}>
              <Chip
                tabIndex={-1}
                className="pointer-events-none cursor-default px-2 py-0.5 text-[10px] hover:border-hairline hover:text-ink-soft"
              >
                {tag}
              </Chip>
            </li>
          ))}
        </ul>
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
