"use client";

import { motion } from "framer-motion";
import { approachSteps } from "@/lib/data";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export function Approach() {
  return (
    <section className="relative overflow-hidden bg-white py-24 dark:bg-slate-950">
      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <div className="mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-4 inline-block rounded-full bg-indigo-500/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:bg-indigo-500/20"
          >
            Our Methodology
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl"
          >
            A Proven Approach to <br />
            <span className="text-indigo-600">Achieve Your Objectives</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400"
          >
            I follow a structured, results-driven process designed to transform complex challenges into scalable, high-performing solutions.
          </motion.p>
        </div>

        {/* Steps Flow */}
        <div className="relative mx-auto max-w-6xl">
          {/* Animated SVG Path for Connections (Desktop) */}
          <svg className="absolute left-0 top-10 hidden h-20 w-full lg:block" preserveAspectRatio="none">
            <path
              d="M 120 40 Q 250 -10 380 40 Q 510 90 640 40 Q 770 -10 900 40"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray="8 8"
              className="animate-flow-dash"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--indigo-500)" stopOpacity="0.2" />
                <stop offset="50%" stopColor="var(--indigo-600)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="var(--indigo-500)" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
            {approachSteps.map((step, index) => (
              <StepCard key={index} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes flow-dash {
          to {
            stroke-dashoffset: -100;
          }
        }
        .animate-flow-dash {
          animation: flow-dash 10s linear infinite;
        }
      `}</style>
    </section>
  );
}

function StepCard({ step, index }: { step: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      viewport={{ once: true }}
      className="group relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left"
    >
      {/* Icon Container */}
      <div className="relative mb-8">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={cn(
            "relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-2xl transition-all duration-500 dark:bg-slate-900",
            "border border-slate-50 group-hover:border-indigo-500/30 dark:border-slate-800"
          )}
        >
          <div 
            className="absolute inset-4 rounded-xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40"
            style={{ backgroundColor: `var(--${step.color}-500)` }}
          />
          <Icon 
            icon={step.icon} 
            className="relative h-10 w-10 transition-colors duration-500 group-hover:text-indigo-600" 
            style={{ color: `var(--${step.color}-600)` }}
          />
        </motion.div>
        
        {/* Step Counter Bubble */}
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white shadow-lg dark:bg-white dark:text-slate-900">
          {index + 1}
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <h3 className="mb-4 text-xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
          {step.title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-500 transition-colors group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300">
          {step.description}
        </p>
      </div>

      {/* Mobile Flow Indicator */}
      {index < approachSteps.length - 1 && (
        <div className="mt-8 block lg:hidden">
          <Icon icon="lucide:chevron-down" className="h-6 w-6 animate-bounce text-slate-200" />
        </div>
      )}
    </motion.div>
  );
}
