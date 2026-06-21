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
        "mb-12 md:mb-16",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      {badge && (
        <ScrollReveal delay={0} distance={20}>
          <div
            className={cn(
              "mb-4 inline-block rounded-full px-4 py-1 text-[20px] font-bold uppercase tracking-[0.2em]",
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
            "text-section-title font-semibold",
            invert ? "text-white" : "text-slate-900 dark:text-white"
          )}
        >
          {titlePrefix && <span className="font-semibold">{titlePrefix} </span>}
          <span className="font-black italic text-primary">{titleHighlight}</span>
          {titleSuffix && <span className="font-semibold"> {titleSuffix}</span>}
        </h2>
      </ScrollReveal>

      <ScrollReveal delay={0.1} distance={24}>
        <p
          className={cn(
            "text-section-desc mx-auto mt-5",
            invert ? "text-slate-300" : "",
            align === "left" && "mx-0"
          )}
        >
          {description}
        </p>
      </ScrollReveal>
    </div>
  );
}
