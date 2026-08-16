"use client";

import Link from "next/link";
import { testimonials } from "@/lib/data";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { TestimonialCarousel } from "@/components/ui/testimonial-carousel";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative overflow-x-hidden bg-canvas py-[var(--section-py)]"
    >
      <div className="ds-container">
        <ScrollReveal>
          <header className="max-w-[40rem]">
            <Eyebrow>Client Success</Eyebrow>
            <h2 className="mt-5 font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
              Trusted{" "}
              <span className="text-pine">Client</span> Feedback
            </h2>
            <p className="mt-5 max-w-[62ch] text-[length:var(--fs-lead)] text-muted">
              Real results from professionals and companies I&apos;ve
              collaborated with across global platforms.
            </p>
          </header>
        </ScrollReveal>

        <TestimonialCarousel
          className="mt-12 md:mt-16"
          items={testimonials}
          featuredIndex={0}
        />

        <ScrollReveal className="mt-10 md:mt-12" delay={0.08}>
          <Button asChild variant="text">
            <Link href="/testimonials">View all testimonials</Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
