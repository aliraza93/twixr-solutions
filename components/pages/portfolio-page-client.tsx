"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LayoutGrid, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getPortfolioProjects,
  portfolioCategories,
  type PortfolioCategoryId,
  type PortfolioProject,
} from "@/lib/data/portfolio";
import { FeaturedPortfolio } from "@/components/sections/featured-portfolio";
import { PageCta } from "@/components/sections/page-cta";
import { StatsStrip } from "@/components/sections/stats-strip";
import { GsapReveal, GsapStagger, GsapStaggerItem } from "@/components/motion/gsap-reveal";

export function PortfolioPageClient() {
  const projects = getPortfolioProjects();

  return (
    <main className="min-h-screen bg-background pt-[120px] lg:pt-[140px]">
      <PortfolioHero />
      <FeaturedPortfolio />
      <ProjectCatalog projects={projects} />
      <StatsStrip variant="primary" />
      <PageCta
        title={
          <>
            Ready to build your <span className="font-black italic text-primary">next product</span>?
          </>
        }
        description="Let's turn your idea into a scalable SaaS or web application."
        emailSubject="New project inquiry"
        secondaryLabel="View Services"
        secondaryHref="/services"
        className="bg-slate-50/90 py-14 dark:bg-slate-900/30 md:py-16"
      />
    </main>
  );
}

function PortfolioHero() {
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
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative overflow-hidden bg-white pb-14 pt-6 lg:pb-20 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.12)_0,transparent_60%)] blur-[80px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.3] dark:opacity-15" />
      </div>

      <div ref={ref} className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
        <span
          data-hero-item
          className="mb-5 inline-block rounded-full bg-primary/5 px-4 py-1 text-[20px] font-bold uppercase tracking-[0.2em] text-primary dark:bg-primary/10"
        >
          Selected Work
        </span>
        <h1 data-hero-item className="text-display font-medium text-slate-900 dark:text-white">
          Product <span className="font-black italic text-primary">Portfolio</span>
        </h1>
        <p data-hero-item className="text-section-desc mx-auto mt-4">
          SaaS platforms, AI automation, and cloud-native products built for startups and global
          teams — from MVP to scale.
        </p>
      </div>
    </section>
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
    <section className="relative py-12 md:py-14">
      <div className="container mx-auto max-w-6xl px-4">
        <GsapReveal className="mb-6 text-center md:mb-8">
          <span className="mb-3 inline-block rounded-full bg-primary/5 px-4 py-1 text-[20px] font-bold uppercase tracking-[0.2em] text-primary dark:bg-primary/10">
            Catalog
          </span>
          <h2 className="text-section-title font-semibold text-slate-900 dark:text-white">
            All <span className="font-black italic text-primary">Projects</span>
          </h2>
          <p className="text-section-desc mx-auto mt-3">
            Filter by category or search the stack — case studies across SaaS, AI, and cloud.
          </p>
        </GsapReveal>

        <GsapReveal delay={0.05} className="mb-6 rounded-2xl border border-slate-200/90 bg-white/85 p-4 shadow-sm backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-950/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, stacks, keywords…"
                className="h-10 border-slate-200/90 bg-white pl-10 pr-10 text-sm dark:border-slate-700 dark:bg-slate-900/80"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {portfolioCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    activeCategory === cat.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  )}
                >
                  {cat.id === "all" && <LayoutGrid className="h-3.5 w-3.5" />}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </GsapReveal>

        {filtered.length === 0 ? (
          <GsapReveal className="rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
            <p className="text-sm text-muted-foreground">No projects match your filters.</p>
          </GsapReveal>
        ) : (
          <GsapStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <GsapStaggerItem key={project.slug}>
                <ProjectCard project={project} />
              </GsapStaggerItem>
            ))}
          </GsapStagger>
        )}
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: PortfolioProject }) {
  return (
    <Link
      href={`/portfolio/${project.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white transition-all duration-300 hover:border-primary/25 hover:shadow-md dark:border-slate-700 dark:bg-slate-950/50"
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
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {project.year}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">{project.client}</p>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{project.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-normal text-slate-600 dark:text-slate-400">
          {project.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-slate-200/90 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-all group-hover:gap-2.5">
          View case study
          <Icon icon="lucide:arrow-right" className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
