"use client";

import { cn } from "@/lib/utils";
import { SITE_STATS } from "@/lib/data/site-stats";
import { ScrollRevealItem, ScrollStagger } from "@/components/motion/scroll-reveal";

type StatsStripProps = {
  variant?: "dark" | "primary";
  className?: string;
};

export function StatsStrip({ variant = "dark", className }: StatsStripProps) {
  return (
    <section
      className={cn(
        variant === "primary"
          ? "bg-primary py-12 text-primary-foreground md:py-14"
          : "bg-slate-950 py-16 text-white lg:py-20",
        className
      )}
    >
      <div className="container mx-auto max-w-6xl px-4">
        <ScrollStagger className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
          {SITE_STATS.map((stat) => (
            <ScrollRevealItem key={stat.value + stat.line1} className="text-center lg:text-left">
              <p
                className={cn(
                  "font-black tracking-tight text-white",
                  stat.value.length > 12
                    ? "text-balance text-lg sm:text-xl md:text-2xl"
                    : "text-xl sm:text-2xl md:text-3xl"
                )}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-300">
                {stat.line2 != null ? `${stat.line1} · ${stat.line2}` : stat.line1}
              </p>
            </ScrollRevealItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}
