"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { experiences } from "@/lib/data";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

export function Experience() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Sorting experiences latest first
  const sortedExperiences = [...experiences].sort((a, b) => {
    if (a.period.includes("Present")) return -1;
    if (b.period.includes("Present")) return 1;
    return 0;
  });

  return (
    <section className="relative overflow-hidden bg-slate-50/50 py-16 dark:bg-slate-950 md:py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          badge="Professional Path"
          titlePrefix="Career"
          titleHighlight="Evolution"
          description="A timeline of my professional growth, from early engineering roles to technical leadership and full-stack expertise."
          className="mb-8 md:mb-10"
        />

        {/* Motion Accordion Stack with Visible Hierarchy Line */}
        <div className="relative mx-auto max-w-4xl">
          {/* Enhanced Hierarchy Line */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 sm:left-9" />

          <div className="relative space-y-2.5">
            {sortedExperiences.map((exp, index) => (
              <ScrollReveal key={exp.company} delay={index * 0.06}>
              <ExperienceBar 
                exp={exp} 
                isOpen={expandedIndex === index}
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperienceBar({ exp, isOpen, onClick }: { exp: any; isOpen: boolean; onClick: () => void }) {
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-500",
        isOpen 
          ? "border-primary/30 bg-white shadow-lg shadow-slate-200/30 dark:border-primary/20 dark:bg-slate-900" 
          : "border-slate-100 bg-white/80 hover:border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
      )}
    >
      {/* Subtle Side Color Indicator */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1.5 transition-opacity duration-500 bg-primary",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Header (Always Visible) */}
      <div 
        onClick={onClick}
        className="relative flex cursor-pointer items-center justify-between gap-3 p-4 sm:p-5"
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div 
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-500 sm:h-11 sm:w-11",
              isOpen ? "scale-105 shadow-md bg-primary" : "bg-slate-50"
            )}
          >
             <Icon 
               icon={exp.logo} 
               className={cn(
                 "relative z-10 h-5 w-5 transition-colors duration-500 sm:h-5 sm:w-5",
                 isOpen ? "text-primary-foreground" : "text-slate-400"
               )} 
             />
          </div>
          <div className="min-w-0">
            <h3 className={cn(
              "truncate text-sm font-bold tracking-tight transition-colors sm:text-base",
              isOpen ? "text-slate-900 dark:text-white" : "text-slate-500"
            )}>
              {exp.company}
            </h3>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-300 sm:text-[10px]">{exp.period.split("-")[0]}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <div className="hidden text-right sm:block">
            <p className={cn(
              "text-sm font-bold transition-colors",
              isOpen ? "text-primary" : "text-slate-400"
            )}>{exp.role}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-300 sm:text-[10px]">{exp.location}</p>
          </div>
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 sm:h-9 sm:w-9",
            isOpen ? "bg-primary border-primary text-primary-foreground" : "bg-white border-slate-100 text-slate-300 dark:bg-slate-800 dark:border-slate-700"
          )}>
            <Icon icon={isOpen ? "lucide:minus" : "lucide:plus"} className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
               <div className="grid grid-cols-1 gap-6 border-t border-slate-50 pt-5 md:grid-cols-12 md:gap-8 dark:border-slate-800/50">
                 {/* Left: Role Story */}
                 <div className="md:col-span-8">
                    <p className="mb-4 text-sm leading-normal text-slate-600 dark:text-slate-400">
                       {exp.description}
                    </p>
                    
                    {/* Tech Badges */}
                    <div className="flex flex-wrap gap-1.5">
                       {exp.technologies.map((tech: string) => (
                         <span 
                           key={tech} 
                           className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary"
                         >
                            <div className="h-1 w-1 rounded-full bg-primary" />
                            {tech}
                         </span>
                       ))}
                    </div>
                 </div>

                 {/* Right: Quick Facts & Link */}
                 <div className="flex flex-col gap-5 md:col-span-4 md:border-l md:border-slate-50 md:pl-8 dark:md:border-slate-800">
                    <div>
                      <h4 className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:text-[10px]">Timeframe</h4>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{exp.period}</p>
                    </div>
                    <div>
                      <h4 className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:text-[10px]">Domain</h4>
                      <div className="flex flex-wrap gap-2">
                        {exp.categories.map((cat: string) => (
                           <span key={cat} className="text-[10px] font-black uppercase tracking-widest text-primary sm:text-[11px]">{cat}</span>
                        ))}
                      </div>
                    </div>
                    {exp.link !== "#" && (
                       <a 
                         href={exp.link}
                         target="_blank"
                         className="group/link mt-auto flex items-center justify-between rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
                       >
                         <span>Full Project</span>
                         <Icon icon="lucide:external-link" className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                       </a>
                    )}
                 </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}





