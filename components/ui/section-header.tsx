"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
    <div className={cn(
      "mb-16 md:mb-24",
      align === "center" ? "text-center" : "text-left",
      className
    )}>
      {badge && (
        <motion.div
// ... existing badge code ...
          className={cn(
            "mb-4 inline-block rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em]",
            invert ? "bg-white/10 text-white" : "bg-primary/5 text-primary dark:bg-primary/10"
          )}
        >
          {badge}
        </motion.div>
      )}
      
      <motion.h2
        className={cn(
          "text-4xl font-black tracking-tight sm:text-6xl",
          invert ? "text-white" : "text-slate-900 dark:text-white"
        )}
      >
        {titlePrefix} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary">
          {titleHighlight}
        </span> {titleSuffix}
      </motion.h2>

      <motion.p
// ... existing p code ...
        className={cn(
          "mx-auto mt-6 max-w-2xl text-lg",
          invert ? "text-slate-300" : "text-slate-600 dark:text-slate-400",
          align === "left" && "mx-0"
        )}
      >
        {description}
      </motion.p>
    </div>
  );
}
