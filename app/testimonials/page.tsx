"use client";

import Link from "next/link";
import { testimonials } from "@/content/testimonials";
import { Icon } from "@iconify/react";
import { ArrowLeft, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/sections/page-hero";
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollStagger,
} from "@/components/motion/scroll-reveal";

function platformTone(icon: string) {
  if (icon.includes("upwork")) return "text-[#14a800]";
  if (icon.includes("fiverr")) return "text-[#1dbf73]";
  if (icon.includes("linkedin")) return "text-[#0a66c2]";
  if (icon.includes("facebook")) return "text-[#1877f2]";
  return "text-pine";
}

function byline(role: string, company: string) {
  if (role && company && role !== company) return `${role} · ${company}`;
  return role || company;
}

export default function TestimonialsPage() {
  return (
    <main className="min-h-screen bg-canvas pt-[120px] lg:pt-[140px]">
      <div className="ds-container">
        <ScrollReveal className="mb-8">
          <Button variant="text" asChild>
            <Link href="/">
              <ArrowLeft
                aria-hidden
                className="transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:-translate-x-0.5"
              />
              Back to Home
            </Link>
          </Button>
        </ScrollReveal>
      </div>

      <PageHero
        className="pt-0"
        eyebrow="RESULTS"
        title="All Client Reviews"
        emphasis="Reviews"
        description="Explore the complete history of feedback from professional collaborations and successful project deliveries."
      />

      <section className="bg-canvas pb-24">
        <div className="ds-container">
          <ScrollStagger className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <ScrollRevealItem key={`${testimonial.name}-${idx}`} className="h-full">
                <Card
                  variant="base"
                  className="relative flex h-full min-h-[280px] flex-col"
                >
                  <Icon
                    icon={testimonial.platform}
                    aria-hidden
                    className={cn(
                      "absolute right-8 top-8 h-6 w-6",
                      platformTone(testimonial.platform)
                    )}
                  />

                  <div
                    className="mb-5 flex gap-0.5"
                    aria-label={`${testimonial.rating} out of 5 stars`}
                  >
                    {Array.from({ length: testimonial.rating }, (_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-pine text-pine"
                        strokeWidth={0}
                      />
                    ))}
                  </div>

                  <blockquote className="flex-1 pr-10 text-[length:var(--fs-body)] leading-relaxed italic text-ink-soft">
                    &ldquo;{testimonial.content}&rdquo;
                  </blockquote>

                  <footer className="mt-8 flex items-center gap-3.5 border-t border-hairline pt-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={testimonial.image}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full border border-hairline object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-sora text-sm font-semibold tracking-[-0.02em] text-ink">
                        {testimonial.name}
                      </p>
                      <p className="truncate font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                        {byline(testimonial.role, testimonial.company)}
                      </p>
                    </div>
                  </footer>
                </Card>
              </ScrollRevealItem>
            ))}
          </ScrollStagger>
        </div>
      </section>
    </main>
  );
}
