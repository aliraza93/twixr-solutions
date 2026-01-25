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
        <div className="mb-16 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl"
          >
            Work Experience
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400"
          >
            My professional journey and the roles I've held throughout my career
          </motion.p>
        </div>

        {/* Categories Filter */}
        <div className="mb-16 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "secondary"}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-full px-6 transition-all duration-300",
                activeCategory === cat ? "bg-teal-600 hover:bg-teal-700 shadow-lg scale-105" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              )}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative mx-auto max-w-5xl">
          {/* Vertical Line */}
          <div className="absolute left-4 top-0 h-full w-0.5 bg-slate-200 dark:bg-slate-800 md:left-1/2 md:-translate-x-1/2" />

          <div className="space-y-24">
            <AnimatePresence mode="popLayout">
              {filteredExperiences.map((exp, index) => (
                <ExperienceItem key={exp.company} exp={exp} index={index} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperienceItem({ exp, index }: { exp: any; index: number }) {
  const isEven = index % 2 === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "relative flex flex-col md:flex-row md:justify-between items-start md:items-center",
        isEven ? "md:flex-row-reverse" : ""
      )}
    >
      {/* Content Side */}
      <div className="md:w-[45%] pl-12 md:pl-0">
        <div className="relative rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-xl group">
          {/* Company & Role */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
                <Icon icon={exp.logo} className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{exp.company}</h3>
                <p className="text-sm text-slate-500">{exp.location}</p>
              </div>
            </div>
            {exp.link !== "#" && (
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <a href={exp.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  Visit <Icon icon="lucide:external-link" />
                </a>
              </Button>
            )}
          </div>

          <div className="mb-4">
            <h4 className="text-lg font-semibold text-teal-600">{exp.role}</h4>
            <p className="text-sm font-medium text-slate-400">{exp.period}</p>
          </div>

          <p className="mb-6 text-slate-600 dark:text-slate-400 leading-relaxed">
            {exp.description}
          </p>

          {/* Project Previews */}
          {exp.projects.length > 0 && (
            <div className="relative mb-8 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar scroll-smooth">
                {exp.projects.map((project: any, i: number) => (
                  <motion.div
                    key={project.title}
                    whileHover={{ y: -10 }}
                    className="relative shrink-0 w-64 h-32 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden group/project"
                  >
                    {/* Placeholder for project images - gradient background with title */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{project.title} Preview</span>
                    </div>
                    {/* Floating Title on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/project:opacity-100 transition-opacity">
                       <span className="text-xs font-bold text-white px-2 py-1 bg-teal-600 rounded-md shadow-lg">{project.title}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-2">
            {exp.technologies.map((tech: string) => (
              <Badge key={tech} variant="secondary" className="bg-slate-50 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Node */}
      <div className="absolute left-4 md:left-1/2 top-8 md:top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full border-4 border-white bg-teal-600 shadow-[0_0_0_4px_rgba(13,148,136,0.2)] z-30" />

      {/* Spacer side */}
      <div className="hidden md:block md:w-[45%]" />
    </motion.div>
  );
}
