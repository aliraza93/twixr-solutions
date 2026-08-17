"use client";

import { cn } from "@/lib/utils";
import { SITE_STATS } from "@/lib/data/site-stats";
import { ScrollRevealItem, ScrollStagger } from "@/components/motion/scroll-reveal";

type StatsStripProps = {
  variant?: "dark" | "primary";
  className?: string;
};

export function StatsStrip({ className }: StatsStripProps) {
  return (
    <section className={cn("band-dark py-16 lg:py-20", className)}>
      <div className="ds-container">
        <ScrollStagger className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
          {SITE_STATS.map((stat) => (
            <ScrollRevealItem key={stat.value + stat.line1} className="text-center lg:text-left">
              <p
                className={cn(
                  "font-sora font-extrabold tracking-[-0.02em] text-lime",
                  stat.value.length > 12
                    ? "text-balance text-lg sm:text-xl md:text-2xl"
                    : "text-xl sm:text-2xl md:text-3xl"
                )}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-d-muted">
                {stat.line2 != null ? `${stat.line1} · ${stat.line2}` : stat.line1}
              </p>
            </ScrollRevealItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}
