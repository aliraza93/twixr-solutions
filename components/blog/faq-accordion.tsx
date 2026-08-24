"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { cn } from "@/lib/utils";
import type { BlogFaq } from "@/lib/blog/markdown";

type BlogFaqAccordionProps = {
  faqs: BlogFaq[];
  className?: string;
};

export function BlogFaqAccordion({ faqs, className }: BlogFaqAccordionProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<Set<number>>(() => new Set(faqs.length ? [0] : []));

  if (!faqs.length) return null;

  const toggle = (index: number) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <section id="faq" className={cn("scroll-mt-28", className)} aria-labelledby={`${baseId}-heading`}>
      <h2
        id={`${baseId}-heading`}
        className="mb-5 font-sora text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl"
      >
        Frequently asked questions
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIds.has(index);
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;

          return (
            <Card
              key={`${faq.question}-${index}`}
              variant="base"
              className={cn("overflow-hidden p-0 hover:translate-y-0", isOpen && "border-pine")}
            >
              <h3 className="m-0">
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left sm:p-5"
                >
                  <span className="text-sm font-semibold text-ink sm:text-base">{faq.question}</span>
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-transform duration-[var(--dur)] motion-reduce:transition-none",
                      isOpen
                        ? "rotate-180 border-pine bg-pine text-white"
                        : "border-hairline text-muted"
                    )}
                    aria-hidden
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className={cn(!isOpen && "hidden")}
              >
                <div className="border-t border-hairline px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                  <MarkdownContent source={faq.answer} className="prose-blog--compact" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
