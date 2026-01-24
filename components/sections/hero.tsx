"use client";

import { motion } from "framer-motion";
import { ArrowRight, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-[120px] pb-24 lg:pt-[160px] lg:pb-32">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-full -translate-x-1/2 opacity-20 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-purple-500/20 to-transparent blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          
          {/* Availability Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 text-sm font-medium backdrop-blur-md"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            Available Now for New Projects
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mb-6 max-w-4xl font-heading text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:leading-[1.1]"
          >
            Build Scalable{" "}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              SaaS & Web Apps
            </span>{" "}
            with a Top 10% Developer
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Senior Full Stack Engineer (7+ Years) specializing in Laravel, Next.js, and Cloud Infrastructure. 
            I transform complex technical challenges into high-performance solutions.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button size="lg" className="h-12 rounded-full px-8 text-base">
              Start a Project
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base">
              View Portfolio
            </Button>
          </motion.div>

          {/* Social Proof / Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-1 gap-8 border-y border-border/50 bg-background/50 py-8 backdrop-blur sm:grid-cols-3"
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">100%</span>
              <span className="text-sm font-medium text-muted-foreground">Job Success Score</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">$30k+</span>
              <span className="text-sm font-medium text-muted-foreground">Earnings on Upwork</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">Top Rated</span>
              <span className="text-sm font-medium text-muted-foreground">Top 10% Talent</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
