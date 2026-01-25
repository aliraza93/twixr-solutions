"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { experiences } from "@/lib/data";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";

export function Experience() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Sorting experiences latest first
  const sortedExperiences = [...experiences].sort((a, b) => {
    if (a.period.includes("Present")) return -1;
    if (b.period.includes("Present")) return 1;
    return 0;
  });

  return (
    <section className="relative overflow-hidden bg-slate-50/50 py-24 dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <SectionHeader
          badge="Professional Path"
          titlePrefix="Career"
          titleHighlight="Evolution"
          description="A timeline of my professional growth, from early engineering roles to technical leadership and full-stack expertise."
        />

        {/* Motion Accordion Stack with Visible Hierarchy Line */}
        <div className="relative mx-auto max-w-4xl">
          {/* Enhanced Hierarchy Line */}
          <div className="absolute left-10 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-800 sm:left-14" />

          <div className="relative space-y-4">
            {sortedExperiences.map((exp, index) => (
              <ExperienceBar 
                key={exp.company} 
                exp={exp} 
                isOpen={expandedIndex === index}
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              />
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
        "relative overflow-hidden rounded-[2rem] border transition-all duration-500",
        isOpen 
          ? "border-teal-500/30 bg-white shadow-xl shadow-slate-200/40 dark:border-teal-500/20 dark:bg-slate-900" 
          : "border-slate-100 bg-white/80 hover:border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
      )}
    >
      {/* Subtle Side Color Indicator */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5 transition-opacity duration-500"
        style={{ backgroundColor: exp.color, opacity: isOpen ? 1 : 0 }}
      />

      {/* Header (Always Visible) */}
      <div 
        onClick={onClick}
        className="relative flex cursor-pointer items-center justify-between p-6 sm:p-10"
      >
        <div className="flex items-center gap-8">
          <div 
            className={cn(
              "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-500",
              isOpen ? "scale-110 shadow-lg" : ""
            )}
            style={{ backgroundColor: isOpen ? exp.color : '#f8fafc' }}
          >
             <Icon 
               icon={exp.logo} 
               className={cn(
                 "relative z-10 h-7 w-7 transition-colors duration-500",
                 isOpen ? "text-white" : "text-slate-400"
               )} 
             />
          </div>
          <div>
            <h3 className={cn(
              "text-xl font-bold tracking-tight transition-colors sm:text-2xl",
              isOpen ? "text-slate-900 dark:text-white" : "text-slate-500"
            )}>
              {exp.company}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">{exp.period.split("-")[0]}</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden text-right sm:block">
            <p className={cn(
              "text-lg font-bold transition-colors",
              isOpen ? "text-teal-600" : "text-slate-400"
            )}>{exp.role}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{exp.location}</p>
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-500",
            isOpen ? "bg-teal-600 border-teal-600 text-white" : "bg-white border-slate-100 text-slate-300 dark:bg-slate-800 dark:border-slate-700"
          )}>
            <Icon icon={isOpen ? "lucide:minus" : "lucide:plus"} className="h-6 w-6" />
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
            <div className="p-6 pt-0 sm:p-10 sm:pt-0">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-slate-50 pt-10 dark:border-slate-800/50">
                 {/* Left: Role Story */}
                 <div className="md:col-span-8">
                    <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400 mb-10">
                       {exp.description}
                    </p>
                    
                    {/* Tech Badges */}
                    <div className="flex flex-wrap gap-2">
                       {exp.technologies.map((tech: string) => (
                         <span 
                           key={tech} 
                           className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 transition-colors hover:bg-teal-500/10 hover:text-teal-600"
                         >
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: exp.color }} />
                            {tech}
                         </span>
                       ))}
                    </div>
                 </div>

                 {/* Right: Quick Facts & Link */}
                 <div className="md:col-span-4 flex flex-col gap-10 md:border-l md:border-slate-50 md:pl-12 dark:md:border-slate-800">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Timeframe</h4>
                      <p className="text-base font-bold text-slate-900 dark:text-white">{exp.period}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Domain</h4>
                      <div className="flex flex-wrap gap-3">
                        {exp.categories.map((cat: string) => (
                           <span key={cat} className="text-xs font-black text-teal-600 uppercase tracking-widest">{cat}</span>
                        ))}
                      </div>
                    </div>
                    {exp.link !== "#" && (
                       <a 
                         href={exp.link}
                         target="_blank"
                         className="group/link mt-auto flex items-center justify-between rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white transition-all hover:bg-teal-600 dark:bg-white dark:text-slate-900 dark:hover:bg-teal-500 dark:hover:text-white"
                       >
                         <span>Full Project</span>
                         <Icon icon="lucide:external-link" className="h-5 w-5 transition-transform group-hover/link:translate-x-1 group-hover/link:-translate-y-1" />
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





