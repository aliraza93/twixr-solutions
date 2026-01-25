"use client";

import { motion } from "framer-motion";
import { testimonials } from "@/lib/data";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TestimonialsPage() {
  return (
    <main className="min-h-screen bg-slate-50 pt-32 pb-24 dark:bg-slate-950">
      <div className="container mx-auto px-4">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <Link href="/" className="group inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-teal-600">
            <Icon icon="lucide:arrow-left" className="transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </motion.div>

        {/* Header */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-block rounded-full bg-teal-500/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 dark:bg-teal-500/20"
          >
            Full Archive
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-7xl"
          >
            All Client <span className="text-teal-600">Reviews</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 max-w-2xl text-xl text-slate-500 dark:text-slate-400"
          >
            Explore the complete history of feedback from professional collaborations and successful project deliveries.
          </motion.p>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={`${testimonial.name}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative flex flex-col justify-between rounded-[2.5rem] border border-white bg-white/60 p-8 shadow-sm backdrop-blur-xl transition-all hover:border-teal-500/30 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div className="absolute right-8 top-8">
                <Icon 
                  icon={testimonial.platform} 
                  className={cn(
                    "h-8 w-8 transition-transform origin-right",
                    testimonial.platform.includes("upwork") && "text-[#14a800] scale-[1.2]",
                    testimonial.platform.includes("fiverr") && "text-[#1dbf73] scale-[1.5]",
                    testimonial.platform.includes("linkedin") && "text-[#0a66c2]",
                    testimonial.platform.includes("facebook") && "text-[#1877f2]"
                  )} 
                />
              </div>

              <div>
                <div className="mb-4 flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Icon key={i} icon="material-symbols:star" className="h-4 w-4 text-amber-400" />
                  ))}
                </div>
                <p className="mb-8 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                  "{testimonial.content}"
                </p>
              </div>

              <div className="flex items-center gap-4 mt-auto border-t border-slate-100 pt-6 dark:border-slate-800/50">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-100 shadow-sm dark:border-slate-800">
                  <img src={testimonial.image} alt={testimonial.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{testimonial.name}</h4>
                  <p className="text-xs font-medium text-slate-400">{testimonial.role} @ {testimonial.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
