"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Check, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Approach } from "@/components/sections/approach";
import { FeaturedPortfolio } from "@/components/sections/featured-portfolio";
import { PageCta } from "@/components/sections/page-cta";
import { StatsStrip } from "@/components/sections/stats-strip";
import { TechStack } from "@/components/sections/tech-stack";
import { GsapReveal, GsapStagger, GsapStaggerItem } from "@/components/motion/gsap-reveal";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { getIconAccent, ICON_LOCATION, ICON_MAIL, ICON_ON_PRIMARY } from "@/lib/icon-accents";
import { footerData } from "@/lib/data";
import { aboutBio, aboutHighlights } from "@/lib/data/about";

const CONTACT_EMAIL = aboutBio.email;

export function AboutPageClient() {
  return (
    <main className="min-h-screen bg-background pt-[120px] lg:pt-[140px]">
      <AboutHero />
      <AboutIntro />
      <StatsStrip variant="primary" />
      <ScrollReveal>
        <TechStack />
      </ScrollReveal>
      <ScrollReveal>
        <FeaturedPortfolio limit={2} />
      </ScrollReveal>
      <ScrollReveal>
        <Approach />
      </ScrollReveal>
      <PageCta />
    </main>
  );
}

function AboutHero() {
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
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out" }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative overflow-hidden bg-white pb-10 pt-6 lg:pb-14 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.1)_0,transparent_60%)] blur-[80px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.28] dark:opacity-15" />
      </div>

      <div ref={ref} className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
        <span
          data-hero-item
          className="mb-5 inline-block rounded-full bg-primary/5 px-4 py-1 text-[20px] font-bold uppercase tracking-[0.2em] text-primary dark:bg-primary/10"
        >
          About Me
        </span>
        <h1 data-hero-item className="text-display font-medium text-slate-900 dark:text-white">
          Hi, I&apos;m <span className="font-black italic text-primary">Ali Raza</span>
        </h1>
        <p data-hero-item className="text-section-desc mx-auto mt-4">
          {aboutBio.subtitle}
        </p>
      </div>
    </section>
  );
}

function AboutIntro() {
  return (
    <section className="pb-12 md:pb-14">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <GsapReveal>
            <div className="relative mx-auto max-w-md lg:mx-0">
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg dark:border-slate-700">
                <img
                  src={aboutBio.image}
                  alt={aboutBio.name}
                  className="aspect-4/5 w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-md dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs font-bold text-primary">Top Rated Plus</p>
                <p className="text-[10px] text-muted-foreground">on Upwork</p>
              </div>
            </div>
          </GsapReveal>

          <div>
            <GsapReveal>
              <h2 className="text-section-title font-semibold text-slate-900 dark:text-white">
                {aboutBio.title.split("&")[0].trim()}{" "}
                <span className="font-black italic text-primary">& Content Creator</span>
              </h2>
              <div className="mt-4 space-y-4">
                {aboutBio.paragraphs.map((p) => (
                  <p
                    key={p.slice(0, 32)}
                    className="text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400"
                  >
                    {p}
                  </p>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className={cn("h-4 w-4", ICON_LOCATION)} />
                  {aboutBio.location}
                </span>
                <a
                  href={`mailto:${aboutBio.email}`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <Mail className={cn("h-4 w-4", ICON_MAIL)} />
                  {aboutBio.email}
                </a>
              </div>
            </GsapReveal>

            <GsapStagger className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {aboutHighlights.map((item, index) => {
                const accent = getIconAccent(index);
                return (
                <GsapStaggerItem key={item}>
                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/40">
                    <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", accent.icon)} aria-hidden />
                    <span className="text-xs text-slate-700 sm:text-sm dark:text-slate-300">{item}</span>
                  </div>
                </GsapStaggerItem>
              );
              })}
            </GsapStagger>

            <GsapReveal className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="h-10 cursor-pointer rounded-full px-6 text-sm font-bold"
                asChild
              >
                <a href={`mailto:${CONTACT_EMAIL}?subject=Project inquiry`}>
                  Hire Me
                  <ArrowRight className={cn("ml-2 h-4 w-4", ICON_ON_PRIMARY)} />
                </a>
              </Button>
              <div className="flex gap-2">
                {footerData.socials.slice(0, 4).map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-400"
                    aria-label={social.name}
                  >
                    <Icon icon={social.icon} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </GsapReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
