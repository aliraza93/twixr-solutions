"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FilterChip } from "@/components/ui/filter-chip";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollStagger,
} from "@/components/motion/scroll-reveal";
import { PageCta } from "@/components/sections/page-cta";
import { PageHero } from "@/components/sections/page-hero";
import { StatsStrip } from "@/components/sections/stats-strip";

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

export function ServicesPageClient({ services }: { services: ServiceListingItem[] }) {
  return (
    <main className="min-h-screen bg-canvas pt-[120px] lg:pt-[140px]">
      <PageHero
        eyebrow="OUR SERVICES"
        title="Full Stack Development Services"
        emphasis="Development"
        description="From concept to deployment — scalable SaaS, APIs, and web apps tailored to your business goals."
      />
      <ServicesGrid services={services} />
      <StatsStrip />
      <PageCta />
    </main>
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
];

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
    <section className="relative overflow-hidden border-t border-hairline bg-surface py-20 md:py-24">
      <div className="ds-container">
        <ScrollReveal className="mb-10 md:mb-12">
          <SectionHeading
            align="center"
            eyebrow="Catalog"
            title="What I build"
            description="Browse by track or search the stack — each card links to a deeper write-up."
          />
        </ScrollReveal>

        <ScrollReveal delay={0.04} className="mb-8">
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
                  placeholder="Search services, stacks, keywords…"
                  className="h-10 border-hairline bg-canvas pl-10 pr-10 text-sm text-ink shadow-none placeholder:text-muted focus-visible:border-pine focus-visible:ring-pine"
                  aria-label="Search services"
                />
                {query.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setQuery("");
                    setActiveCategory("all");
                  }}
                >
                  Reset filters
                </Button>
              )}
            </div>

            <div
              className="mt-4 flex flex-wrap gap-2 border-t border-hairline pt-4"
              role="tablist"
              aria-label="Service categories"
            >
              {CATALOG_CATEGORIES.map((cat) => {
                const active = activeCategory === cat.id;
                const Icon = cat.icon;
                return (
                  <FilterChip
                    key={cat.id}
                    active={active}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 opacity-90" aria-hidden />}
                    {cat.label}
                  </FilterChip>
                );
              })}
            </div>
          </Card>
        </ScrollReveal>

        <p className="mb-6 text-center font-mono text-xs uppercase tracking-[0.12em] text-muted">
          {filtered.length} service{filtered.length === 1 ? "" : "s"}{" "}
          {hasActiveFilters ? "match your filters" : "available"}
        </p>

        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-hairline bg-canvas py-14 text-center text-sm text-muted">
            No services match. Try another category or clear your search.
          </p>
        ) : (
          <ScrollStagger
            key={`${activeCategory}-${query}`}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((service) => {
              const Icon = SERVICE_ICONS[service.icon] ?? Layers;
              const previewTags = service.tags.slice(0, 3);
              const moreCount = service.tags.length - previewTags.length;

              return (
                <ScrollRevealItem key={service.slug} className="h-full">
                  <Card
                    variant="base"
                    className="group flex h-full flex-col overflow-hidden p-0"
                  >
                    <div className="relative aspect-16/10 overflow-hidden rounded-t-lg border-b border-hairline">
                      <Link
                        href={`/services/${service.slug}`}
                        className="absolute inset-0"
                        tabIndex={-1}
                        aria-hidden
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={service.illustration}
                          alt=""
                          width={800}
                          height={500}
                          className="h-full w-full object-cover object-center"
                          loading="lazy"
                          decoding="async"
                        />
                      </Link>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 p-3">
                        <Chip
                          tabIndex={-1}
                          className="max-w-[68%] cursor-default gap-1.5 border-hairline bg-canvas/95 px-2 py-1 text-[10px] text-ink hover:border-hairline hover:text-ink"
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 text-pine" aria-hidden />
                          <span className="truncate">{service.categoryLabel}</span>
                        </Chip>
                        <Chip
                          tabIndex={-1}
                          className="cursor-default gap-1 border-hairline bg-canvas/95 px-2 py-1 text-[10px] text-ink hover:border-hairline hover:text-ink"
                        >
                          <Star
                            className="h-3 w-3 shrink-0 fill-pine text-pine"
                            aria-hidden
                          />
                          Top Rated Plus
                        </Chip>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col px-7 pb-7 pt-6">
                      <h3 className="font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em]">
                        <Link
                          href={`/services/${service.slug}`}
                          className="text-ink transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-pine focus-visible:outline-none"
                        >
                          {service.title}
                        </Link>
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                        {service.description}
                      </p>
                      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                        {previewTags.join(" · ")}
                        {moreCount > 0 ? ` · +${moreCount} more` : ""}
                      </p>

                      <div className="mt-5 flex items-end justify-between gap-3 border-t border-hairline pt-4">
                        <div>
                          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                            Engagement
                          </p>
                          <p className="text-sm font-semibold text-ink">Scope-based</p>
                        </div>
                        <Button variant="text" asChild>
                          <Link href={`/services/${service.slug}`}>
                            View details
                            <span
                              aria-hidden
                              className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                            >
                              →
                            </span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </ScrollRevealItem>
              );
            })}
          </ScrollStagger>
        )}
      </div>
    </section>
  );
}
