"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CalEmbed } from "@/components/scheduling/cal-embed";
import { schedulePageContent } from "@/lib/data/scheduling";

export function SchedulePageClient() {
  return (
    <main className="min-h-screen bg-background pt-[120px] lg:pt-[140px]">
      <ScheduleHero />
      <section className="pb-16 md:pb-20">
        <div className="container mx-auto max-w-5xl px-4">
          <CalEmbed />
        </div>
      </section>
    </main>
  );
}

function ScheduleHero() {
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
    <section className="relative overflow-hidden bg-white pb-8 pt-6 lg:pb-10 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.1)_0,transparent_60%)] blur-[80px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.28] dark:opacity-15" />
      </div>

      <div ref={ref} className="container relative z-10 mx-auto max-w-3xl px-4 text-center">
        <span
          data-hero-item
          className="mb-5 inline-block rounded-full bg-primary/5 px-4 py-1 text-[20px] font-bold uppercase tracking-[0.2em] text-primary dark:bg-primary/10"
        >
          Book a Call
        </span>
        <h1 data-hero-item className="text-display font-medium text-slate-900 dark:text-white">
          {schedulePageContent.title}
        </h1>
        <p data-hero-item className="text-section-desc mx-auto mt-4">
          {schedulePageContent.description}
        </p>
      </div>
    </section>
  );
}
