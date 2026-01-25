"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { testimonials } from "@/lib/data";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/section-header";

export function Testimonials() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Split testimonials into two rows for the marquee effect
  const middleIndex = Math.ceil(testimonials.length / 2);
  const row1 = testimonials.slice(0, middleIndex);
  const row2 = testimonials.slice(middleIndex);

  return (
    <section className="relative overflow-hidden bg-white py-24 dark:bg-slate-950">
      <div className="container relative z-10 mx-auto px-4">
        <SectionHeader
          badge="Client Success"
          titlePrefix="Trusted"
          titleHighlight="Client"
          titleSuffix="Feedback"
          description="Real results from professionals and companies I've collaborated with across global platforms."
        />

        {/* Marquee Rows */}
        <div className="flex flex-col gap-8">
          <MarqueeRow items={row1} direction="left" speed={40} />
          <MarqueeRow items={row2} direction="right" speed={50} />
        </div>

        {/* Action Button */}
        <div className="mt-20 text-center">
          <Button asChild variant="outline" size="lg" className="cursor-pointer rounded-full px-8 py-6 text-base font-bold transition-all hover:bg-primary hover:text-primary-foreground">
            <Link href="/testimonials" className="flex items-center gap-2">
              View All Testimonials
              <Icon icon="lucide:arrow-right" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 bg-primary/5 blur-[120px]" />
    </section>
  );
}

function MarqueeRow({ items, direction = "left", speed = 30 }: { items: any[]; direction?: "left" | "right"; speed?: number }) {
  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className="flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        animate={{
          x: direction === "left" ? ["0%", "-33.33%"] : ["-33.33%", "0%"],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex gap-8 px-4"
      >
        {duplicatedItems.map((item, idx) => (
          <TestimonialCard key={`${item.name}-${idx}`} testimonial={item} />
        ))}
      </motion.div>
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: any }) {
  return (
    <div className="relative w-[320px] cursor-pointer shrink-0 transform-gpu overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary/30">
      {/* Platform Icon */}
      <div className="absolute right-6 top-6 transition-all duration-300 group-hover:scale-110">
        <Icon 
          icon={testimonial.platform} 
          className={cn(
            "h-6 w-6 transition-transform",
            testimonial.platform.includes("upwork") && "text-[#14a800] scale-[1.3]",
            testimonial.platform.includes("fiverr") && "text-[#1dbf73] scale-[1.6]",
            testimonial.platform.includes("linkedin") && "text-[#0a66c2]",
            testimonial.platform.includes("facebook") && "text-[#1877f2]"
          )} 
        />
      </div>

      {/* Rating */}
      <div className="mb-4 flex gap-0.5">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Icon key={i} icon="material-symbols:star" className="h-4 w-4 text-amber-400" />
        ))}
      </div>

      {/* Content */}
      <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400 italic">
        "{testimonial.content}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-100 dark:border-slate-800">
          <img src={testimonial.image} alt={testimonial.name} className="h-full w-full object-cover" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{testimonial.name}</h4>
          <p className="text-[10px] font-medium text-slate-400">{testimonial.role} @ {testimonial.company}</p>
        </div>
      </div>
    </div>
  );
}
