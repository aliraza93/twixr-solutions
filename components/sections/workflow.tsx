"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, GitBranch, Terminal, Zap } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/card";

export function Workflow() {
  return (
    <section className="overflow-hidden bg-slate-950 py-24">
      <div className="container mx-auto px-4">
        <SectionHeader
          invert={true}
          badge="Product Life-Cycle"
          titlePrefix="Streamlined"
          titleHighlight="Development"
          titleSuffix="Workflow"
          description="From concept to deployment, I use a battle-tested process to ensure code quality and rapid delivery."
        />

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Column: 3D Visualization */}
            <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative mx-auto aspect-square w-full max-w-md perspective-1000"
          >
            {/* 3D Floating Cards Stack */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-10 top-10 z-30 w-64 rounded-xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl dark:bg-slate-900/50"
            >
                <div className="mb-3 flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-white">Cloud Infrastructure</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-white/50 mb-1">
                    <span>Active Clusters</span>
                    <span>100%</span>
                  </div>
                  <div className="h-2 w-full rounded bg-primary/20">
                     <div className="h-full w-full rounded bg-primary shrink-0 transition-all duration-1000" />
                  </div>
                  <div className="h-2 w-3/4 rounded bg-primary/20" />
                </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute right-10 top-32 z-20 w-64 rounded-xl border border-white/20 bg-white/80 p-4 shadow-xl backdrop-blur-md dark:bg-slate-800/80"
            >
               <div className="mb-3 flex items-center gap-2">
                 <GitBranch className="h-5 w-5 text-blue-500" />
                 <span className="text-sm font-semibold text-slate-800 dark:text-white">CI/CD Automation</span>
               </div>
               <div className="space-y-2">
                 <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Production Build</span>
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                 </div>
                 <div className="h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-full w-full rounded-full bg-blue-500" />
                 </div>
                 <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Tests</span>
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                 </div>
                  <div className="h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-full w-3/4 rounded-full bg-blue-500" />
                 </div>
               </div>
            </motion.div>

             <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-10 left-20 z-10 w-56 rounded-xl border border-white/20 bg-purple-500/10 p-4 shadow-lg backdrop-blur-sm"
            >
               <div className="mb-3 flex items-center gap-2">
                 <Zap className="h-5 w-5 text-purple-500" />
                 <span className="text-sm font-semibold text-white">Optimization</span>
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <div className="rounded bg-purple-500/20 p-2 text-center text-xs font-bold text-purple-700 dark:text-purple-300">100/100</div>
                 <div className="rounded bg-purple-500/20 p-2 text-center text-xs font-bold text-purple-700 dark:text-purple-300">A+ Security</div>
               </div>
            </motion.div>

            {/* Connecting Lines/Glow (Abstract) */}
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl" />
          </motion.div>

          {/* Right Column: Steps */}
          <div className="space-y-8">
            {[
              { title: "Strategic Architecture", desc: "Crafting scalable system blueprints and data models for enterprise growth.", icon: GitBranch, color: "bg-blue-500" },
              { title: "Precision Engineering", desc: "Developing robust features with Next.js, Laravel, and AI-driven automation.", icon: Terminal, color: "bg-primary" },
              { title: "Optimized Deployment", desc: "Automated CI/CD pipelines, SEO supremacy, and sub-second performance.", icon: Zap, color: "bg-purple-500" },
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="flex gap-4"
              >
                <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${step.color} text-white shadow-lg`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  <p className="mt-1 text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
