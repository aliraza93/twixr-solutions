"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";
import type { ServiceDetail } from "@/lib/data/services";
import { testimonials as fallbackTestimonials } from "@/content/testimonials";
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollStagger,
} from "@/components/motion/scroll-reveal";
import { TestimonialMarquee } from "@/components/sections/testimonial-marquee";
import { PageCta } from "@/components/sections/page-cta";
import { site } from "@/content/site";

import type { Testimonial } from "@/lib/cms/types";

const CONTACT_EMAIL = site.contact.email;

type ServiceDetailClientProps = {
  service: ServiceDetail;
  testimonials?: Testimonial[];
};

export function ServiceDetailClient({ service, testimonials }: ServiceDetailClientProps) {
  const quotes = testimonials?.length ? testimonials : fallbackTestimonials;
  const defaultPackage = service.packages.find((p) => p.popular) ?? service.packages[0];

  return (
    <main className="min-h-screen bg-canvas pt-[120px] lg:pt-[140px]">
      <div className="ds-container pb-16 md:pb-20">
        <ScrollReveal className="mb-6">
          <Button variant="text" asChild>
            <Link href="/services">
              <ArrowLeft
                aria-hidden
                className="transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:-translate-x-0.5"
              />
              Back to Services
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
                  {service.categoryLabel}
                </Chip>
                <Chip
                  tabIndex={-1}
                  className="pointer-events-none cursor-default gap-1 hover:border-hairline hover:text-ink-soft"
                >
                  <Star className="h-3 w-3 fill-pine text-pine" aria-hidden />
                  Top Rated Plus
                </Chip>
              </div>
              <SectionHeading
                as="h1"
                align="left"
                title={service.title}
                description={service.longDescription}
              />
              <ul className="mt-4 flex list-none flex-wrap gap-1.5 p-0">
                {service.tags.map((tag) => (
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
              <ServiceGallery images={service.gallery} title={service.title} />
            </ScrollReveal>
          </div>

          <div className="lg:col-span-1">
            <ScrollReveal delay={0.08}>
              <Card variant="base" className="p-5 hover:translate-y-0 lg:sticky lg:top-28 sm:p-6">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                  {defaultPackage.name}
                </p>
                <p className="mt-0.5 font-sora text-lg font-bold text-ink">Scope-based</p>
                <p className="text-xs text-muted">{defaultPackage.subtitle}</p>

                <dl className="mt-4 space-y-2 border-y border-hairline py-3.5 text-xs sm:text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Delivery</dt>
                    <dd className="font-medium text-ink">{defaultPackage.delivery}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Revisions</dt>
                    <dd className="font-medium text-ink">{defaultPackage.revisions}</dd>
                  </div>
                </dl>

                <div className="mt-4 space-y-2">
                  <Button variant="primary" className="w-full" asChild>
                    <a
                      href={`mailto:${CONTACT_EMAIL}?subject=Project inquiry: ${encodeURIComponent(service.title)}`}
                    >
                      Contact for project
                      <span
                        aria-hidden
                        className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                      >
                        →
                      </span>
                    </a>
                  </Button>
                  <Button variant="ghost" className="w-full" asChild>
                    <a
                      href={`mailto:${CONTACT_EMAIL}?subject=Question: ${encodeURIComponent(service.title)}`}
                    >
                      Ask a question
                    </a>
                  </Button>
                </div>

                <div className="mt-4">
                  <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                    What you get
                  </p>
                  <ul className="space-y-2">
                    {service.sidebarHighlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs text-muted sm:text-sm"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pine" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </div>

        <ScrollReveal className="mt-16 md:mt-20">
          <SectionHeading
            align="center"
            eyebrow="Deliverables"
            title="What's included"
            emphasis="included"
            description="Everything in a typical engagement at this service level."
            className="mb-8"
          />
          <ScrollStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {service.included.map((item) => (
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
            eyebrow="Pricing"
            title="Choose your package"
            emphasis="package"
            description="Scope-based tiers - contact me for a tailored proposal."
            className="mb-8"
          />
          <ScrollStagger className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {service.packages.map((pkg) => (
              <ScrollRevealItem key={pkg.id} className="h-full">
                <Card
                  variant={pkg.popular ? "feature" : "base"}
                  className={cn(
                    "relative flex h-full flex-col",
                    pkg.popular && "band-dark hover:shadow-none"
                  )}
                >
                  {pkg.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill bg-lime px-3 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-d-bg">
                      Most popular
                    </span>
                  )}
                  <h3
                    className={cn(
                      "font-sora text-lg font-bold tracking-[-0.02em]",
                      pkg.popular ? "text-d-text" : "text-ink"
                    )}
                  >
                    {pkg.name}
                  </h3>
                  <p className={cn("mt-1 text-sm", pkg.popular ? "text-d-muted" : "text-muted")}>
                    {pkg.subtitle}
                  </p>
                  <p
                    className={cn(
                      "mt-4 font-sora text-xl font-bold",
                      pkg.popular ? "text-lime" : "text-ink"
                    )}
                  >
                    Scope-based
                  </p>
                  <dl
                    className={cn(
                      "mt-4 space-y-2 border-b pb-4 text-sm",
                      pkg.popular ? "border-d-hairline" : "border-hairline"
                    )}
                  >
                    <div className="flex justify-between gap-4">
                      <dt className={pkg.popular ? "text-d-muted" : "text-muted"}>Delivery</dt>
                      <dd className={pkg.popular ? "font-medium text-d-text" : "font-medium text-ink"}>
                        {pkg.delivery}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className={pkg.popular ? "text-d-muted" : "text-muted"}>Revisions</dt>
                      <dd className={pkg.popular ? "font-medium text-d-text" : "font-medium text-ink"}>
                        {pkg.revisions}
                      </dd>
                    </div>
                  </dl>
                  <ul className="mt-4 flex-1 space-y-2">
                    {pkg.features.map((f) => (
                      <li
                        key={f}
                        className={cn(
                          "flex items-start gap-2 text-sm",
                          pkg.popular ? "text-d-muted" : "text-muted"
                        )}
                      >
                        <Check
                          className={cn(
                            "mt-0.5 h-3.5 w-3.5 shrink-0",
                            pkg.popular ? "text-lime" : "text-pine"
                          )}
                          aria-hidden
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn("mt-5 w-full", pkg.popular && "focus-visible:ring-offset-ink")}
                    variant={pkg.popular ? "primary" : "ghost"}
                    asChild
                  >
                    <a
                      href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${pkg.name} package - ${service.title}`)}`}
                    >
                      Contact for project
                    </a>
                  </Button>
                </Card>
              </ScrollRevealItem>
            ))}
          </ScrollStagger>
        </ScrollReveal>

        <ScrollReveal className="mt-16 md:mt-20">
          <SectionHeading
            align="center"
            eyebrow="Support"
            title="Frequently asked questions"
            emphasis="questions"
            className="mb-8"
          />
          <div className="space-y-3">
            <ServiceFaqAccordion faqs={service.faqs} />
          </div>
        </ScrollReveal>

        <ScrollReveal className="relative mt-16 overflow-hidden md:mt-20">
          <SectionHeading
            align="center"
            eyebrow="Client Success"
            title="What clients say"
            emphasis="say"
            description="Feedback from professionals I've worked with on similar projects."
            className="mb-8"
          />
          <TestimonialMarquee items={quotes} rows={2} />
        </ScrollReveal>
      </div>
      <PageCta
        title="Ready to start this engagement?"
        emphasis="engagement"
        emailSubject={`Project inquiry: ${service.title}`}
        secondaryLabel="View all services"
        secondaryHref="/services"
      />
    </main>
  );
}

function ServiceGallery({ images, title }: { images: string[]; title: string }) {
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
          alt={`${title} preview ${active + 1}`}
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

function ServiceFaqAccordion({ faqs }: { faqs: ServiceDetail["faqs"] }) {
  const [activeId, setActiveId] = useState<number | null>(0);

  return (
    <>
      {faqs.map((faq, index) => {
        const isOpen = activeId === index;
        return (
          <ScrollReveal key={faq.question} delay={index * 0.03}>
            <Card
              variant="base"
              className={cn(
                "overflow-hidden p-0 hover:translate-y-0",
                isOpen && "border-pine"
              )}
            >
              <button
                type="button"
                onClick={() => setActiveId(isOpen ? null : index)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left sm:p-5"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-ink">{faq.question}</span>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-transform duration-[var(--dur)]",
                    isOpen
                      ? "rotate-180 border-pine bg-pine text-white"
                      : "border-hairline text-muted"
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
              {isOpen && (
                <p className="border-t border-hairline px-4 pb-4 pt-0 text-sm leading-relaxed text-muted sm:px-5 sm:pb-5">
                  <span className="block pt-3">{faq.answer}</span>
                </p>
              )}
            </Card>
          </ScrollReveal>
        );
      })}
    </>
  );
}
