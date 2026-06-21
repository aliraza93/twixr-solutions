"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ServiceDetail } from "@/lib/data/services";
import { testimonials } from "@/lib/data";
import { GsapReveal, GsapStagger, GsapStaggerItem } from "@/components/motion/gsap-reveal";
import { TestimonialMarquee } from "@/components/sections/testimonial-marquee";

const CONTACT_EMAIL = "ali@twixrsolutions.com";

type ServiceDetailClientProps = {
  service: ServiceDetail;
};

function SectionHeading({
  badge,
  title,
  highlight,
  description,
  align = "center",
}: {
  badge?: string;
  title: string;
  highlight?: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "mb-5 md:mb-6",
        align === "center" ? "text-center" : "text-left"
      )}
    >
      {badge && (
        <span className="mb-3 inline-block rounded-full bg-primary/5 px-4 py-1 text-[20px] font-bold uppercase tracking-[0.2em] text-primary dark:bg-primary/10">
          {badge}
        </span>
      )}
      <h2 className="text-section-title font-semibold text-slate-900 dark:text-white">
        {title && <span className="font-semibold">{title} </span>}
        {highlight && <span className="font-black italic text-primary">{highlight}</span>}
      </h2>
      {description && (
        <p
          className={cn(
            "text-section-desc mt-3",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export function ServiceDetailClient({ service }: ServiceDetailClientProps) {
  const defaultPackage = service.packages.find((p) => p.popular) ?? service.packages[0];

  return (
    <main className="min-h-screen bg-background pt-[120px] lg:pt-[140px]">
      <div className="container mx-auto max-w-6xl px-4 pb-16 md:pb-20">
        <GsapReveal className="mb-5">
          <Link
            href="/services"
            className="group inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Services
          </Link>
        </GsapReveal>

        {/* Hero + sidebar */}
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-5 lg:col-span-2">
            <GsapReveal>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {service.categoryLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" aria-hidden />
                  Top Rated Plus
                </span>
              </div>
              <h1 className="text-page-title text-slate-900 dark:text-white">{service.title}</h1>
              <p className="text-lead mt-2 text-sm">{service.longDescription}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {service.tags.map((tag) => (
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
              <ServiceGallery images={service.gallery} title={service.title} />
            </GsapReveal>
          </div>

          <div className="lg:col-span-1">
            <GsapReveal delay={0.08}>
              <aside className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm lg:sticky lg:top-28 dark:border-slate-700/90 dark:bg-slate-950/60 sm:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {defaultPackage.name}
                </p>
                <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">Scope-based</p>
                <p className="text-xs text-muted-foreground">{defaultPackage.subtitle}</p>

                <dl className="mt-4 space-y-2 border-y border-border py-3.5 text-xs sm:text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Delivery</dt>
                    <dd className="font-medium text-foreground">{defaultPackage.delivery}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Revisions</dt>
                    <dd className="font-medium text-foreground">{defaultPackage.revisions}</dd>
                  </div>
                </dl>

                <div className="mt-4 space-y-2">
                  <Button
                    size="lg"
                    className="h-10 w-full cursor-pointer rounded-full text-sm font-bold shadow-md shadow-primary/10"
                    asChild
                  >
                    <a
                      href={`mailto:${CONTACT_EMAIL}?subject=Project inquiry: ${encodeURIComponent(service.title)}`}
                    >
                      Contact for project
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-10 w-full cursor-pointer rounded-full border-slate-200 text-sm dark:border-slate-700"
                    asChild
                  >
                    <a
                      href={`mailto:${CONTACT_EMAIL}?subject=Question: ${encodeURIComponent(service.title)}`}
                    >
                      Ask a question
                    </a>
                  </Button>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    What you get
                  </p>
                  <ul className="space-y-2">
                    {service.sidebarHighlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 sm:text-sm"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </GsapReveal>
          </div>
        </div>

        {/* What's included */}
        <GsapReveal as="section" className="mt-12 md:mt-14">
          <SectionHeading
            badge="Deliverables"
            title="What's"
            highlight="included"
            description="Everything in a typical engagement at this service level."
          />
          <GsapStagger className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {service.included.map((item) => (
              <GsapStaggerItem key={item}>
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/40">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                  <span className="text-xs text-slate-700 sm:text-sm dark:text-slate-300">{item}</span>
                </div>
              </GsapStaggerItem>
            ))}
          </GsapStagger>
        </GsapReveal>

        {/* Packages */}
        <GsapReveal as="section" className="mt-12 md:mt-14">
          <SectionHeading
            badge="Pricing"
            title="Choose your"
            highlight="package"
            description="Scope-based tiers — contact me for a tailored proposal."
          />
          <GsapStagger className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {service.packages.map((pkg) => (
              <GsapStaggerItem key={pkg.id}>
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-2xl border p-5 transition-shadow sm:p-6",
                    pkg.popular
                      ? "border-primary bg-primary/5 shadow-md dark:bg-primary/10"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950/40"
                  )}
                >
                  {pkg.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{pkg.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{pkg.subtitle}</p>
                  <p className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Scope-based</p>
                  <dl className="mt-4 space-y-2 border-b border-border pb-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Delivery</dt>
                      <dd className="font-medium">{pkg.delivery}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Revisions</dt>
                      <dd className="font-medium">{pkg.revisions}</dd>
                    </div>
                  </dl>
                  <ul className="mt-4 flex-1 space-y-2">
                    {pkg.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-5 h-10 w-full cursor-pointer rounded-full text-sm font-semibold sm:h-11"
                    variant={pkg.popular ? "default" : "outline"}
                    asChild
                  >
                    <a
                      href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${pkg.name} package — ${service.title}`)}`}
                    >
                      Contact for project
                    </a>
                  </Button>
                </div>
              </GsapStaggerItem>
            ))}
          </GsapStagger>
        </GsapReveal>

        {/* FAQ */}
        <GsapReveal as="section" className="mt-12 md:mt-14">
          <SectionHeading badge="Support" title="Frequently asked" highlight="questions" />
          <div className="space-y-2.5">
            <ServiceFaqAccordion faqs={service.faqs} />
          </div>
        </GsapReveal>

        {/* Testimonials — horizontal floating marquee */}
        <GsapReveal as="section" className="relative mt-12 overflow-hidden md:mt-14">
          <SectionHeading
            badge="Client Success"
            title="What clients"
            highlight="say"
            description="Feedback from professionals I've worked with on similar projects."
          />
          <TestimonialMarquee items={testimonials} rows={2} />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
        </GsapReveal>
      </div>
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
      <div className="relative aspect-16/10 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
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

function ServiceFaqAccordion({ faqs }: { faqs: ServiceDetail["faqs"] }) {
  const [activeId, setActiveId] = useState<number | null>(0);

  return (
    <>
      {faqs.map((faq, index) => {
        const isOpen = activeId === index;
        return (
          <GsapReveal key={faq.question} delay={index * 0.03} y={24}>
            <div
              className={cn(
                "overflow-hidden rounded-2xl border transition-colors",
                isOpen
                  ? "border-primary/30 bg-white shadow-sm dark:border-primary/20 dark:bg-slate-900"
                  : "border-slate-100 bg-slate-50/50 hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900/40"
              )}
            >
              <button
                type="button"
                onClick={() => setActiveId(isOpen ? null : index)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left sm:p-5"
              >
                <span className="text-sm font-bold text-slate-900 dark:text-white">{faq.question}</span>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-transform duration-300",
                    isOpen
                      ? "rotate-180 border-primary bg-primary text-primary-foreground"
                      : "border-slate-200 text-slate-400 dark:border-slate-600"
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="border-t border-border px-4 pb-4 pt-0 text-sm leading-normal text-slate-600 sm:px-5 sm:pb-5 dark:text-slate-400">
                      <span className="block pt-3">{faq.answer}</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GsapReveal>
        );
      })}
    </>
  );
}
