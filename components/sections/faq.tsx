"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { faqs } from "@/lib/data";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

export function FAQ() {
  const [activeId, setActiveId] = useState<number | null>(0);

  return (
    <section className="relative overflow-hidden bg-white py-16 dark:bg-slate-950 md:py-20">
      <div className="container relative z-10 mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left: Text Content */}
          <div className="lg:col-span-5">
            <SectionHeader
              className="sticky top-28 mb-0 md:mb-0"
              align="left"
              badge="Support Hub"
              titlePrefix="Common"
              titleHighlight="Questions"
              description="Can't find what you're looking for? Feel free to contact me directly."
            />
          </div>

          {/* Right: Accordion */}
          <div className="lg:col-span-7">
            <div className="space-y-2.5">
              {faqs.map((faq, index) => (
                <ScrollReveal key={index} delay={index * 0.05}>
                <FAQItem 
                  faq={faq} 
                  isOpen={activeId === index} 
                  onClick={() => setActiveId(activeId === index ? null : index)}
                />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Background Accent */}
      <div className="absolute -left-20 top-1/2 -z-10 h-96 w-96 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
    </section>
  );
}

function FAQItem({ faq, isOpen, onClick }: { faq: any; isOpen: boolean; onClick: () => void }) {
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "group overflow-hidden rounded-2xl border transition-all duration-300",
        isOpen 
          ? "border-primary/30 bg-white shadow-lg shadow-slate-200/40 dark:border-primary/20 dark:bg-slate-900 dark:shadow-none" 
          : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
      )}
    >
      <button
        onClick={onClick}
        className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left sm:p-5"
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-white shadow-sm transition-all duration-300 dark:bg-slate-800",
            isOpen ? "scale-105 border-primary/50 text-primary" : "text-slate-400 group-hover:text-slate-600"
          )}>
            <Icon icon={faq.icon} className="h-4 w-4" />
          </div>
          <span className={cn(
            "text-sm font-bold tracking-tight transition-colors sm:text-[15px]",
            isOpen ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
          )}>
            {faq.question}
          </span>
        </div>
        <div className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-500",
          isOpen ? "rotate-180 bg-primary border-primary text-primary-foreground" : "border-slate-200 text-slate-400 group-hover:border-slate-300"
        )}>
          <Icon icon="lucide:chevron-down" className="h-4 w-4" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-4 pb-4 pl-[3.25rem] pt-0 text-sm leading-normal text-slate-500 sm:px-5 sm:pb-5 sm:pl-[3.75rem] dark:text-slate-400">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
