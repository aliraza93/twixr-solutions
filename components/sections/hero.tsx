"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-[140px] pb-24 lg:pt-[180px] lg:pb-32">
        {/* Stripe-like Mesh Gradient Background */}
         <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          
          {/* Left Column: Text Content */}
          <div className="flex flex-col items-start text-left">
            
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 pr-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 group cursor-pointer"
            >
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-bold">New</span>
              <span className="ml-1">Available for 2026 Projects</span>
              <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-heading text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:leading-[1.1]"
            >
              Financial <br/>
              infrastructure <br/>
              to grow your <br/>
              revenue
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl leading-relaxed"
            >
               Join the millions of companies that use my custom software solutions to accept payments online, manage scalable backends, and build profitable businesses.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Button size="lg" className="h-12 rounded-full px-8 text-base bg-foreground text-background hover:bg-foreground/90">
                Start now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="ghost" className="h-12 rounded-full px-8 text-base hover:bg-secondary/50">
                Contact sales
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          {/* Right Column: Visual/Phone Mockup (Abstract representation) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative mx-auto w-full max-w-[500px]"
          >
             {/* Abstract Phone/Dashboard UI */}
            <div className="relative z-10 rounded-2xl border border-white/20 bg-black/40 backdrop-blur-xl p-4 shadow-2xl dark:bg-zinc-900/50">
                {/* Mockup Header */}
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="h-3 w-3 rounded-full bg-red-500/50" />
                     <div className="h-2 w-20 rounded-full bg-white/10" />
                </div>
                {/* Mockup Body Content */}
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="h-24 w-1/3 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20" />
                        <div className="flex-1 space-y-2">
                             <div className="h-4 w-3/4 rounded bg-white/10" />
                             <div className="h-4 w-1/2 rounded bg-white/10" />
                             <div className="mt-4 h-8 w-24 rounded bg-blue-500" />
                        </div>
                    </div>
                     <div className="h-32 w-full rounded-lg bg-zinc-800/50 p-4">
                        <div className="mb-2 h-2 w-12 rounded bg-white/20" />
                        <div className="h-20 w-full rounded bg-gradient-to-r from-emerald-500/10 to-blue-500/10" />
                     </div>
                </div>
            </div>

            {/* Background Glow behind Phone */}
            <div className="absolute -inset-4 -z-10 rounded-[30px] bg-gradient-to-br from-violet-600 to-indigo-600 opacity-30 blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
