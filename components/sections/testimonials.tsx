"use client";

import Link from "next/link";
import { testimonials, testimonialsCopy } from "@/content/testimonials";
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
            <Eyebrow>{testimonialsCopy.eyebrow}</Eyebrow>
            <h2 className="mt-5 font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
              {testimonialsCopy.headingBefore}{" "}
              <span className="text-pine">{testimonialsCopy.headingEmphasis}</span>{" "}
              {testimonialsCopy.headingAfter}
            </h2>
            <p className="mt-5 max-w-[62ch] text-[length:var(--fs-lead)] text-muted">
              {testimonialsCopy.intro}
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
