"use client";

import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

interface SectionHeaderProps {
  badge?: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix?: string;
  description: string;
  align?: "center" | "left";
  className?: string;
  invert?: boolean;
}

export function SectionHeader({
  badge,
  titlePrefix,
  titleHighlight,
  titleSuffix,
  description,
  align = "center",
  className,
  invert = false,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-16 md:mb-24",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      {badge && (
        <ScrollReveal delay={0} distance={20}>
          <div
            className={cn(
              "mb-4 inline-block rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em]",
              invert ? "bg-white/10 text-white" : "bg-primary/5 text-primary dark:bg-primary/10"
            )}
          >
            {badge}
          </div>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.05} distance={24}>
        <h2
          className={cn(
            "text-3xl font-bold tracking-tight sm:text-5xl",
            invert ? "text-white" : "text-slate-900 dark:text-white"
          )}
        >
          {titlePrefix && <>{titlePrefix} </>}
          <span className="font-black italic text-primary">{titleHighlight}</span>
          {titleSuffix && <> {titleSuffix}</>}
        </h2>
      </ScrollReveal>

      <ScrollReveal delay={0.1} distance={24}>
        <p
          className={cn(
            "mx-auto mt-6 max-w-2xl text-lg",
            invert ? "text-slate-300" : "text-slate-600 dark:text-slate-400",
            align === "left" && "mx-0"
          )}
        >
          {description}
        </p>
      </ScrollReveal>
    </div>
  );
}
