"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { faqs } from "@/lib/data";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";

export function FAQ() {
  const [activeId, setActiveId] = useState<number | null>(0);

  return (
    <section className="relative overflow-hidden bg-white py-24 dark:bg-slate-950">
      <div className="container relative z-10 mx-auto px-4">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          {/* Left: Text Content */}
          <div className="lg:col-span-5">
            <SectionHeader
              className="sticky top-32"
              align="left"
              badge="Support Hub"
              titlePrefix="Common"
              titleHighlight="Questions"
              description="Can't find what you're looking for? Feel free to contact me directly."
            />
          </div>

          {/* Right: Accordion */}
          <div className="lg:col-span-7">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <FAQItem 
                  key={index} 
                  faq={faq} 
                  isOpen={activeId === index} 
                  onClick={() => setActiveId(activeId === index ? null : index)}
                />
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
        "group overflow-hidden rounded-3xl border transition-all duration-300",
        isOpen 
          ? "border-primary/30 bg-white shadow-xl shadow-slate-200/50 dark:border-primary/20 dark:bg-slate-900 dark:shadow-none" 
          : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
      )}
    >
      <button
        onClick={onClick}
        className="flex w-full cursor-pointer items-center justify-between p-6 text-left sm:p-8"
      >
        <div className="flex items-center gap-6">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border transition-all duration-300 dark:bg-slate-800",
            isOpen ? "scale-110 border-primary/50 text-primary" : "text-slate-400 group-hover:text-slate-600"
          )}>
            <Icon icon={faq.icon} className="h-6 w-6" />
          </div>
          <span className={cn(
            "text-lg font-bold tracking-tight transition-colors",
            isOpen ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
          )}>
            {faq.question}
          </span>
        </div>
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-500",
          isOpen ? "rotate-180 bg-primary border-primary text-primary-foreground" : "border-slate-200 text-slate-400 group-hover:border-slate-300"
        )}>
          <Icon icon="lucide:chevron-down" className="h-5 w-5" />
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
            <div className="px-6 pb-8 pl-24 pt-0 sm:px-8 sm:pb-10 sm:pl-[104px] text-lg leading-relaxed text-slate-500 dark:text-slate-400">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
