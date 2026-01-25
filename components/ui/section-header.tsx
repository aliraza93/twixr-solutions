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
}

export function SectionHeader({
  badge,
  titlePrefix,
  titleHighlight,
  titleSuffix,
  description,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn(
      "mb-16 md:mb-24",
      align === "center" ? "text-center" : "text-left",
      className
    )}>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={cn(
            "mb-4 inline-block rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em]",
            "bg-primary/5 text-primary dark:bg-primary/10"
          )}
        >
          {badge}
        </motion.div>
      )}
      
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl"
      >
        {titlePrefix} <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
          {titleHighlight}
        </span>
        {titleSuffix && (
          <>
            {" "}
            <br />
            {titleSuffix}
          </>
        )}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className={cn(
          "mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400",
          align === "left" && "mx-0"
        )}
      >
        {description}
      </motion.p>
    </div>
  );
}
