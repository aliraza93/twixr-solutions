"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getFeaturedProjects,
  type PortfolioProject,
} from "@/lib/data/portfolio";
import { ScrollReveal, ScrollRevealItem, ScrollStagger } from "@/components/motion/scroll-reveal";

type FeaturedPortfolioProps = {
  projects?: PortfolioProject[];
  limit?: number;
};

export function FeaturedPortfolio({ projects, limit }: FeaturedPortfolioProps) {
  const items = (projects ?? getFeaturedProjects()).slice(0, limit);

  if (items.length === 0) return null;

  return (
    <section className="bg-slate-50/60 py-12 dark:bg-slate-900/30 md:py-14">
      <div className="container mx-auto max-w-6xl px-4">
        <ScrollReveal className="mb-6 text-center md:mb-8">
          <span className="mb-3 inline-block rounded-full bg-primary/5 px-4 py-1 text-[20px] font-bold uppercase tracking-[0.2em] text-primary dark:bg-primary/10">
            Featured
          </span>
          <h2 className="text-section-title font-semibold text-slate-900 dark:text-white">
            Flagship <span className="font-black italic text-primary">Projects</span>
          </h2>
        </ScrollReveal>

        <ScrollStagger className="grid gap-4 lg:grid-cols-2">
          {items.map((project) => (
            <ScrollRevealItem key={project.slug}>
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg dark:border-slate-700 dark:bg-slate-950/60">
      <Link href={`/portfolio/${project.slug}`} className="relative block aspect-16/10 overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
        <div className="absolute left-4 top-4">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-800 backdrop-blur-sm">
            {project.categoryLabel}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-lg font-bold text-white sm:text-xl">{project.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-200">{project.description}</p>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap gap-3">
          {project.metrics.map((m) => (
            <div key={m.label} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/80">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-slate-200/90 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
        <Link
          href={`/portfolio/${project.slug}`}
          className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-primary transition-all hover:gap-3"
        >
          View case study
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
