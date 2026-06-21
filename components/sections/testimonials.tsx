"use client";

import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { testimonials } from "@/lib/data";
import { SectionHeader } from "@/components/ui/section-header";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { TestimonialMarquee } from "@/components/sections/testimonial-marquee";

export function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-white py-16 dark:bg-slate-950 md:py-20">
      <div className="container relative z-10 mx-auto px-4">
        <SectionHeader
          badge="Client Success"
          titlePrefix="Trusted"
          titleHighlight="Client"
          titleSuffix="Feedback"
          description="Real results from professionals and companies I've collaborated with across global platforms."
        />

        <TestimonialMarquee items={testimonials} rows={2} />

        <ScrollReveal className="mt-12 text-center md:mt-14">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-10 cursor-pointer rounded-full px-6 text-sm font-bold transition-all hover:bg-primary hover:text-primary-foreground"
          >
            <Link href="/testimonials" className="flex items-center gap-2">
              View All Testimonials
              <Icon icon="lucide:arrow-right" />
            </Link>
          </Button>
        </ScrollReveal>
      </div>

      <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 bg-primary/5 blur-[120px]" />
    </section>
  );
}
