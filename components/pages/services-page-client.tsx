"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Cloud,
  LayoutGrid,
  Layers,
  Monitor,
  Search,
  Server,
  Smartphone,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollStagger,
} from "@/components/motion/scroll-reveal";

import type {
  ServiceCatalogCategoryId,
  ServiceIconName,
  ServiceListingItem,
} from "@/lib/data/services";

export type { ServiceListingItem };

const SERVICE_ICONS: Record<ServiceIconName, LucideIcon> = {
  Layers,
  Server,
  Monitor,
  Bot,
  Cloud,
  Smartphone,
};

const STATS = [
  { value: "10+", line1: "Years", line2: "Experience" },
  { value: "50+", line1: "Projects", line2: "Delivered" },
  { value: "Top Rated Plus", line1: "on Upwork", line2: null },
  { value: "99.9%", line1: "Client", line2: "Satisfaction" },
] as const;

function motionTransition(reduceMotion: boolean | null, delay = 0) {
  return {
    duration: reduceMotion ? 0 : 0.5,
    delay: reduceMotion ? 0 : delay,
  };
}

export function ServicesPageClient({ services }: { services: ServiceListingItem[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="min-h-screen bg-background pt-[120px] lg:pt-[140px]">
      <ServicesHero reduceMotion={reduceMotion} />
      <ServicesGrid services={services} />
      <StatsStrip />
      <ServicesCta />
    </main>
  );
}

function ServicesHero({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <section className="relative w-full overflow-hidden bg-white pb-20 pt-8 lg:pb-28 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] h-[800px] w-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.12)_0,rgba(255,255,255,0)_60%)] blur-[80px] dark:opacity-50" />
        <div className="absolute top-[10%] right-[0%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.1)_0,rgba(255,255,255,0)_60%)] blur-[80px] dark:opacity-40" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.35] dark:opacity-20" />
      </div>

      <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionTransition(reduceMotion)}
          className="mb-8 inline-block rounded-full bg-primary/5 px-4 py-1 text-[20px] font-bold uppercase tracking-[0.2em] text-primary dark:bg-primary/10"
        >
          OUR SERVICES
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionTransition(reduceMotion, 0.08)}
          className="text-display font-medium text-slate-900 dark:text-white"
        >
          Full Stack{" "}
          <span className="font-black italic text-primary">Development</span>{" "}
          <span className="font-bold text-slate-900 dark:text-white">Services</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionTransition(reduceMotion, 0.16)}
          className="text-section-desc mx-auto mt-4"
        >
          From concept to deployment — scalable web apps, mobile, and AI solutions tailored to your
          business goals.
        </motion.p>
      </div>
    </section>
  );
}

const CATALOG_CATEGORIES: {
  id: "all" | ServiceCatalogCategoryId;
  label: string;
  icon: LucideIcon | null;
}[] = [
  { id: "all", label: "All categories", icon: LayoutGrid },
  { id: "product", label: "Web & SaaS", icon: Layers },
  { id: "backend", label: "API & backend", icon: Server },
  { id: "ai", label: "AI automation", icon: Bot },
  { id: "cloud", label: "Cloud & DevOps", icon: Cloud },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

/** Light card headers — soft washes that align with hero mesh (violet / cyan family). */
const SERVICE_MEDIA_WASH: Record<ServiceListingItem["icon"], string> = {
  Layers: "from-violet-500/[0.14] via-slate-100/90 to-white dark:from-violet-500/20 dark:via-slate-900 dark:to-slate-950",
  Server: "from-emerald-500/[0.1] via-slate-50 to-white dark:from-emerald-500/15 dark:via-slate-900 dark:to-slate-950",
  Monitor: "from-sky-500/[0.12] via-slate-50 to-white dark:from-sky-500/18 dark:via-slate-900 dark:to-slate-950",
  Bot: "from-primary/[0.08] via-slate-50 to-white dark:from-primary/15 dark:via-slate-900 dark:to-slate-950",
  Cloud: "from-cyan-500/[0.1] via-slate-50 to-white dark:from-cyan-500/15 dark:via-slate-900 dark:to-slate-950",
  Smartphone: "from-fuchsia-500/[0.1] via-slate-50 to-white dark:from-fuchsia-500/15 dark:via-slate-900 dark:to-slate-950",
};

function ServicesGrid({ services }: { services: ServiceListingItem[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | ServiceCatalogCategoryId>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      const catOk = activeCategory === "all" || s.categoryId === activeCategory;
      const text = `${s.title} ${s.description} ${s.tags.join(" ")}`.toLowerCase();
      const qOk = !q || text.includes(q);
      return catOk && qOk;
    });
  }, [services, query, activeCategory]);

  const hasActiveFilters = query.trim().length > 0 || activeCategory !== "all";

  return (
    <section className="relative overflow-hidden border-t border-border bg-muted/35 py-20 md:py-24 dark:bg-slate-900/35">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-[30%] right-[-15%] h-[min(560px,70vw)] w-[min(560px,70vw)] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.08)_0,transparent_65%)] blur-3xl dark:opacity-70" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.07)_0,transparent_65%)] blur-3xl dark:opacity-60" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.22] dark:opacity-15" />
      </div>

      <div className="container relative z-10 mx-auto max-w-6xl px-4">
        <ScrollReveal className="mb-10 text-center md:mb-12">
          <span className="inline-block rounded-full bg-primary/5 px-4 py-1 text-[20px] font-bold uppercase tracking-[0.2em] text-primary dark:bg-primary/15">
            Catalog
          </span>
          <h2 className="text-section-title mt-3 text-slate-900 dark:text-white">
            What I build
          </h2>
          <p className="text-section-desc mx-auto mt-2 text-sm">
            Browse by track or search the stack — each card links to a deeper write-up when those
            pages go live.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.04} className="mb-8 rounded-2xl border border-slate-200/90 bg-white/85 p-4 shadow-sm backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-950/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services, stacks, keywords…"
                className="h-10 border-slate-200/90 bg-white pl-10 pr-10 text-sm text-slate-900 shadow-none placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-primary/25 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
                aria-label="Search services"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                }}
                className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-slate-700 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:text-slate-200 dark:hover:bg-primary/10"
              >
                Reset filters
              </button>
            )}
          </div>

          <div
            className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"
            role="tablist"
            aria-label="Service categories"
          >
            {CATALOG_CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-primary/35 hover:bg-primary/4 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-primary/40"
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5 opacity-90" aria-hidden />}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        <p className="mb-6 text-center text-xs text-muted-foreground">
          {filtered.length} service{filtered.length === 1 ? "" : "s"}{" "}
          {hasActiveFilters ? "match your filters" : "available"}
        </p>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 py-14 text-center text-sm text-muted-foreground">
            No services match. Try another category or clear your search.
          </p>
        ) : (
          <ScrollStagger
            key={`${activeCategory}-${query}`}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((service) => {
              const Icon = SERVICE_ICONS[service.icon] ?? Layers;
              const wash =
                SERVICE_MEDIA_WASH[service.icon] ??
                "from-slate-200/80 via-slate-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-950";
              const previewTags = service.tags.slice(0, 3);
              const moreCount = service.tags.length - previewTags.length;

              return (
                <ScrollRevealItem key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-card text-card-foreground shadow-sm outline-none ring-offset-background transition-[border-color,box-shadow] duration-200 hover:border-primary/25 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-slate-700/90 dark:bg-slate-950/40 dark:hover:border-primary/35"
                  >
                    <div className="relative aspect-16/10 overflow-hidden border-b border-border">
                      <img
                        src={service.illustration}
                        alt=""
                        width={800}
                        height={500}
                        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                        loading="lazy"
                        decoding="async"
                      />
                      <div
                        className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-40 mix-blend-multiply dark:opacity-30 dark:mix-blend-soft-light", wash)}
                        aria-hidden
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-slate-900/5 to-transparent dark:from-black/50 dark:via-transparent"
                        aria-hidden
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                        <span className="inline-flex max-w-[68%] items-center gap-1.5 rounded-lg border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-800 shadow-sm backdrop-blur-sm dark:border-slate-600/80 dark:bg-slate-900/85 dark:text-slate-100">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                          <span className="truncate">{service.categoryLabel}</span>
                        </span>
                        <span className="inline-flex max-w-[min(100%,12rem)] shrink-0 items-center gap-1 rounded-lg border border-slate-200/90 bg-white/90 px-2 py-1 text-[10px] font-semibold leading-tight text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-600/80 dark:bg-slate-900/85 dark:text-slate-200">
                          <Star
                            className="h-3 w-3 shrink-0 fill-yellow-500 text-yellow-500"
                            aria-hidden
                          />
                          Top Rated Plus
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
                      <h3 className="text-base font-semibold leading-snug tracking-tight text-slate-900 dark:text-white">
                        {service.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {service.description}
                      </p>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        {previewTags.join(" · ")}
                        {moreCount > 0 ? ` · +${moreCount} more` : ""}
                      </p>

                      <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Engagement
                          </p>
                          <p className="text-sm font-semibold text-foreground">Scope-based</p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground dark:group-hover:bg-primary dark:group-hover:text-primary-foreground">
                          View details
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                      </div>
                    </div>
                  </Link>
                </ScrollRevealItem>
              );
            })}
          </ScrollStagger>
        )}
      </div>
    </section>
  );
}

function StatsStrip() {
  return (
    <section className="bg-slate-950 py-16 text-white lg:py-20">
      <div className="container mx-auto px-4">
        <ScrollStagger className="grid grid-cols-2 gap-10 lg:grid-cols-4 lg:gap-6">
          {STATS.map((stat) => (
            <ScrollRevealItem
              key={stat.value + stat.line1}
              className="text-center lg:text-left"
            >
              <p
                className={
                  stat.value.length > 12
                    ? "text-balance text-lg font-black tracking-tight text-white sm:text-xl md:text-2xl"
                    : "text-xl font-black tracking-tight text-white sm:text-2xl md:text-3xl"
                }
              >
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-300">
                {stat.line2 != null ? `${stat.line1} · ${stat.line2}` : stat.line1}
              </p>
            </ScrollRevealItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}

function ServicesCta() {
  return (
    <section className="bg-slate-50/90 py-20 dark:bg-slate-900/30">
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <ScrollReveal>
          <h2 className="text-section-title text-slate-900 dark:text-white">
            Ready to start your project?
          </h2>
          <p className="text-section-desc mx-auto mt-3">
            Let&apos;s discuss your requirements and build something great together.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="h-12 cursor-pointer rounded-full px-8 text-base font-bold shadow-lg shadow-primary/10"
              asChild
            >
              <a href="mailto:ali@twixrsolutions.com">
                Start a Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 cursor-pointer rounded-full border-slate-200 px-8 text-base dark:border-slate-700"
              asChild
            >
              <Link href="/portfolio">View Portfolio</Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
