"use client";

import Link from "next/link";
import { testimonials } from "@/lib/data";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollStagger,
} from "@/components/motion/scroll-reveal";

export default function TestimonialsPage() {
  return (
    <main className="min-h-screen bg-slate-50 pt-32 pb-24 dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <ScrollReveal className="mb-12">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-teal-600"
          >
            <Icon
              icon="lucide:arrow-left"
              className="transition-transform group-hover:-translate-x-1"
            />
            Back to Home
          </Link>
        </ScrollReveal>

        <div className="mb-20">
          <ScrollReveal>
            <div className="mb-4 inline-block rounded-full bg-teal-500/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 dark:bg-teal-500/20">
              Full Archive
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.05}>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-7xl">
              All Client <span className="text-teal-600">Reviews</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-xl text-slate-500 dark:text-slate-400">
              Explore the complete history of feedback from professional collaborations and
              successful project deliveries.
            </p>
          </ScrollReveal>
        </div>

        <ScrollStagger className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, idx) => (
            <ScrollRevealItem key={`${testimonial.name}-${idx}`}>
              <article className="relative flex h-full flex-col justify-between rounded-[2.5rem] border border-white bg-white/60 p-8 shadow-sm backdrop-blur-xl transition-all hover:border-teal-500/30 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/40">
                <div className="absolute right-8 top-8">
                  <Icon
                    icon={testimonial.platform}
                    className={cn(
                      "h-8 w-8 origin-right transition-transform",
                      testimonial.platform.includes("upwork") && "scale-[1.2] text-[#14a800]",
                      testimonial.platform.includes("fiverr") && "scale-[1.5] text-[#1dbf73]",
                      testimonial.platform.includes("linkedin") && "text-[#0a66c2]",
                      testimonial.platform.includes("facebook") && "text-[#1877f2]"
                    )}
                  />
                </div>

                <div>
                  <div className="mb-4 flex gap-0.5">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Icon
                        key={i}
                        icon="material-symbols:star"
                        className="h-4 w-4 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="mb-8 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                </div>

                <div className="mt-auto flex items-center gap-4 border-t border-slate-100 pt-6 dark:border-slate-800/50">
                  <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-100 shadow-sm dark:border-slate-800">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-xs font-medium text-slate-400">
                      {testimonial.role} @ {testimonial.company}
                    </p>
                  </div>
                </div>
              </article>
            </ScrollRevealItem>
          ))}
        </ScrollStagger>
      </div>
    </main>
  );
}
