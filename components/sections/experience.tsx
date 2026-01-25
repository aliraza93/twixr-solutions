"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { experiences } from "@/lib/data";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categories = ["All", "AI", "Mobile Apps", "Websites", "Trainings", "ChatBots"];

export function Experience() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredExperiences = experiences.filter(exp => 
    activeCategory === "All" || exp.categories.includes(activeCategory)
  );

  return (
    <section className="relative overflow-hidden bg-white py-24 dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-block rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-600 dark:bg-teal-900/30"
          >
            Professional Path
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl"
          >
            My Experience <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">
              Evolution
            </span>
          </motion.h2>
        </div>

        {/* Categories - Modern Segmented Control */}
        <div className="mb-16 flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-slate-50 p-2 dark:bg-slate-900">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
                  activeCategory === cat 
                    ? "bg-white text-teal-600 shadow-sm dark:bg-slate-800" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {activeCategory === cat && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-slate-800"
                    style={{ zIndex: -1 }}
                  />
                )}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Modern Bento Grid Experience */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredExperiences.map((exp, index) => (
              <ExperienceCard key={exp.company} exp={exp} index={index} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function ExperienceCard({ exp, index }: { exp: any; index: number }) {
  const isLarge = index === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={cn(
        "group relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 dark:border-slate-800 dark:bg-slate-900",
        isLarge ? "md:col-span-4 md:row-span-2" : "md:col-span-2"
      )}
    >
      {/* Background Gradient Glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/5 blur-[100px] transition-all group-hover:bg-teal-500/10" />

      <div className="relative flex h-full flex-col">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl shadow-inner dark:bg-slate-800">
              <Icon icon={exp.logo} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{exp.company}</h3>
              <p className="text-sm font-medium text-teal-600">{exp.role}</p>
            </div>
          </div>
          {exp.link !== "#" && (
             <a 
              href={exp.link} 
              target="_blank" 
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 transition-all hover:border-teal-500 hover:text-teal-600 dark:border-slate-800 dark:bg-slate-900"
            >
              <Icon icon="lucide:arrow-up-right" className="h-5 w-5" />
            </a>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow">
          <p className="text-sm font-medium text-slate-400 mb-4">{exp.period}</p>
          <p className={cn(
            "text-slate-600 dark:text-slate-400 leading-relaxed",
            isLarge ? "text-lg" : "text-sm line-clamp-4 group-hover:line-clamp-none transition-all"
          )}>
            {exp.description}
          </p>
        </div>

        {/* Projects Strip - Modern Horizontal Cards */}
        {isLarge && exp.projects.length > 0 && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {exp.projects.map((project: any) => (
              <motion.div
                key={project.title}
                whileHover={{ scale: 1.02 }}
                className="relative h-32 overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800 group/project"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-blue-500/10" />
                <div className="relative p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{project.title}</span>
                  <div className="mt-2 h-1 w-12 rounded-full bg-teal-500" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-teal-600/90 opacity-0 transition-opacity group-hover/project:opacity-100">
                  <span className="font-bold text-white">View Case Study</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tech Stack */}
        <div className="mt-8 flex flex-wrap gap-2">
          {exp.technologies.slice(0, isLarge ? 10 : 4).map((tech: string) => (
            <span key={tech} className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800">
              {tech}
            </span>
          ))}
          {!isLarge && exp.technologies.length > 4 && (
             <span className="text-[10px] font-bold text-slate-300">+{exp.technologies.length - 4} more</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

