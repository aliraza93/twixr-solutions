"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Terminal, Globe, Code2, Cpu, Database, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden pt-[140px] pb-32 lg:pt-[180px] lg:pb-40 bg-white">
      
      {/* Light Mode: Stripe-like Vibrant Mesh Overlay */}
      <div className="absolute inset-0 top-0 z-0 h-full w-full overflow-hidden">
         {/* Top Right Gradient Blob */}
         <div className="absolute -top-[20%] -right-[10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(99,91,255,0.15)_0,_rgba(255,255,255,0)_60%)] blur-[80px]" />
         <div className="absolute top-[10%] right-[0%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(0,212,255,0.15)_0,_rgba(255,255,255,0)_60%)] blur-[80px]" />
         
         {/* Subtle Grid */}
         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.4]" />
      </div>
          
      <div className="container relative z-10 mx-auto px-4 text-slate-900">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          
          {/* Left Column: Text Content */}
          <div className="flex flex-col items-start text-left">
            
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 pr-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 group cursor-pointer border border-slate-200"
            >
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] uppercase font-bold text-emerald-700 tracking-wide">Available</span>
              <span className="ml-1">Taking new projects for 2026</span>
              <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-heading text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl lg:leading-[1.1] mb-6"
            >
              Build Scalable <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">SaaS & Web Apps</span> <br/>
              with a Top 10% <br/>
              Developer
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-xl text-lg text-slate-600 sm:text-xl leading-relaxed mb-8"
            >
               Senior Full Stack Engineer (7+ Years) specializing in Laravel, Next.js, and Cloud Infrastructure. 
               I transform complex technical challenges into high-performance solutions.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <Button size="lg" className="h-12 rounded-full px-8 text-base bg-slate-900 text-white hover:bg-slate-800 font-semibold shadow-lg shadow-slate-900/10">
                Start a Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base border-slate-200 bg-white text-slate-900 hover:bg-slate-50">
                View Portfolio
              </Button>
            </motion.div>

            {/* Tech Stack Logos */}
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 0.5, delay: 0.4 }}
               className="flex flex-col gap-3"
            >
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Powering solutions with</div>
                <div className="flex items-center gap-6 opacity-60 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                    <div className="flex items-center gap-1.5"><Code2 className="h-5 w-5" /><span className="font-semibold text-slate-700">Next.js</span></div>
                    <div className="flex items-center gap-1.5"><Layout className="h-5 w-5" /><span className="font-semibold text-slate-700">Tailwind</span></div>
                    <div className="flex items-center gap-1.5"><Database className="h-5 w-5" /><span className="font-semibold text-slate-700">Postgres</span></div>
                    <div className="flex items-center gap-1.5"><Cpu className="h-5 w-5" /><span className="font-semibold text-slate-700">AWS</span></div>
                </div>
            </motion.div>
          </div>

          {/* Right Column: Code/Dev Visualization (Light Mode) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
            className="relative mx-auto w-full max-w-[500px] perspective-1000"
          >
             {/* Abstract Dev Environment */}
            <div className="relative z-10 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-200/50 overflow-hidden transform rotate-y-12 rotate-x-6 hover:rotate-0 transition-transform duration-500 ease-out">
                {/* Window Controls */}
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    <div className="ml-2 text-xs font-mono text-slate-400">deployment-script.ts</div>
                </div>
                
                {/* Code Content */}
                <div className="p-6 font-mono text-sm leading-relaxed">
                    <div className="flex gap-4">
                       <div className="text-slate-300 select-none text-right">
                          1<br/>2<br/>3<br/>4<br/>5<br/>6
                       </div>
                       <div className="text-slate-800">
                          <span className="text-purple-600">const</span> <span className="text-blue-600">deploy</span> = <span className="text-purple-600">async</span> () ={">"} {"{"}<br/>
                          &nbsp;&nbsp;<span className="text-purple-600">const</span> infrastructure = <span className="text-purple-600">await</span> cloud.init();<br/>
                          &nbsp;&nbsp;<br/>
                          &nbsp;&nbsp;<span className="text-slate-400">// Scaling to millions</span><br/>
                          &nbsp;&nbsp;<span className="text-purple-600">await</span> infrastructure.scale({"{"}<br/>
                          &nbsp;&nbsp;&nbsp;&nbsp;mode: <span className="text-amber-600">"global"</span>,<br/>
                          &nbsp;&nbsp;&nbsp;&nbsp;uptime: <span className="text-blue-600">99.99</span><br/>
                          &nbsp;&nbsp;{"}"});<br/>
                          {"}"}
                       </div>
                    </div>
                    
                    {/* Floating Status Cards */}
                    <div className="absolute right-6 bottom-6 space-y-3">
                        <motion.div 
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-100 p-3 shadow-sm"
                        >
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-semibold text-emerald-700">System Operational</span>
                        </motion.div>
                        <motion.div 
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.8 }}
                          className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-100 p-3 shadow-sm"
                        >
                            <Globe className="h-4 w-4 text-blue-500" />
                            <span className="text-xs font-semibold text-blue-700">Global CDN Active</span>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Glow Behind */}
            <div className="absolute -inset-10 -z-10 bg-gradient-to-tr from-purple-200/50 to-blue-200/50 blur-3xl rounded-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
