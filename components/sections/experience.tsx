"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { experiences } from "@/lib/data";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export function Experience() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Sorting experiences latest first
  const sortedExperiences = [...experiences].sort((a, b) => {
    if (a.period.includes("Present")) return -1;
    if (b.period.includes("Present")) return 1;
    return 0; // Simple sort for local data
  });

  return (
    <section ref={containerRef} className="relative bg-white py-32 dark:bg-slate-950">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-32 max-w-2xl">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-7xl"
          >
            Proof of <br />
            <span className="text-teal-600">Expertise</span>
          </motion.h2>
          <p className="mt-8 text-xl text-slate-500 leading-relaxed">
            A chronological journey of high-impact roles, technical leadership, 
            and scalable solutions delivered for global clients.
          </p>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Side: Sticky Timeline Indicator */}
          <div className="hidden lg:block lg:col-span-4 h-full">
            <div className="sticky top-40 space-y-12 pl-4">
              {sortedExperiences.map((exp, i) => (
                <TimelineStep key={exp.company} exp={exp} index={i} />
              ))}
            </div>
          </div>

          {/* Right Side: Immersive Content Panels */}
          <div className="lg:col-span-8 space-y-32 lg:space-y-64 pb-32">
            {sortedExperiences.map((exp, i) => (
              <ExperiencePanel key={exp.company} exp={exp} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineStep({ exp, index }: { exp: any; index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0.3 }}
      whileInView={{ opacity: 1 }}
      viewport={{ margin: "-40% 0px -50% 0px" }}
      className="group relative flex items-center gap-6"
    >
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all group-hover:border-teal-500 group-hover:shadow-[0_0_20px_rgba(20,184,166,0.1)]">
        <Icon icon={exp.logo} className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600">{exp.company}</p>
        <p className="text-sm font-medium text-slate-400">{exp.period.split("-")[0]}</p>
      </div>
      
      {/* Connector Line */}
      {index !== experiences.length - 1 && (
        <div className="absolute left-6 top-16 h-20 w-px bg-slate-100 dark:bg-slate-800" />
      )}
    </motion.div>
  );
}

function ExperiencePanel({ exp, index }: { exp: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* High-Fidelity Platform Header */}
      <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="mb-4 flex items-center gap-3">
             <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:bg-teal-900/30">
               {exp.categories[0]}
             </span>
             <div className="h-1 w-1 rounded-full bg-slate-200" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{exp.location}</span>
          </div>
          <h3 className="text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl">{exp.role}</h3>
          <p className="mt-2 text-2xl font-medium text-slate-400">@ {exp.company}</p>
        </div>
        
        {exp.link !== "#" && (
          <a 
            href={exp.link}
            target="_blank"
            className="group/btn flex items-center gap-2 rounded-full border-2 border-slate-900 bg-slate-900 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-transparent hover:text-slate-900 dark:border-white dark:bg-white dark:text-slate-900 dark:hover:bg-transparent dark:hover:text-white"
          >
            View Live Case
            <Icon icon="lucide:arrow-up-right" className="transition-transform group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1" />
          </a>
        )}
      </div>

      {/* Description Content */}
      <div className="max-w-3xl">
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-12">
          {exp.description}
        </p>

        {/* Project Horizontal Reel */}
        {exp.projects.length > 0 && (
          <div className="group/reel relative mb-16">
            <div className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth">
              {exp.projects.map((project: any) => (
                <motion.div
                  key={project.title}
                  whileHover={{ y: -12, scale: 1.02 }}
                  className="relative h-64 w-80 shrink-0 overflow-hidden rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5" />
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-teal-600 opacity-0 transition-opacity group-hover/reel:opacity-100">Project Highlight</p>
                    <h4 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{project.title}</h4>
                  </div>
                  {/* Glassy Overlay on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-teal-600/10 opacity-0 backdrop-blur-[2px] transition-opacity hover:opacity-100">
                    <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center text-teal-600 shadow-xl">
                       <Icon icon="lucide:eye" className="h-5 w-5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Stack Pills */}
        <div className="flex flex-wrap gap-3">
          {exp.technologies.map((tech: string) => (
            <span 
              key={tech} 
              className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            >
              <div className="h-1 w-1 rounded-full bg-teal-500" />
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute -left-20 top-0 -z-10 h-64 w-64 rounded-full bg-teal-500/2 blur-[120px]" />
    </motion.div>
  );
}


