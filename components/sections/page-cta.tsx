"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { ICON_ON_PRIMARY } from "@/lib/icon-accents";

const DEFAULT_EMAIL = "ali@twixrsolutions.com";

type PageCtaProps = {
  title?: ReactNode;
  description?: string;
  email?: string;
  emailSubject?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
};

export function PageCta({
  title = "Ready to start your project?",
  description = "Let's discuss your requirements and build something great together.",
  email = DEFAULT_EMAIL,
  emailSubject = "Project inquiry",
  primaryLabel = "Start a Project",
  secondaryLabel = "View Portfolio",
  secondaryHref = "/portfolio",
  className,
}: PageCtaProps) {
  return (
    <section className={className ?? "bg-slate-50/90 py-20 dark:bg-slate-900/30"}>
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <ScrollReveal>
          <h2 className="text-section-title text-slate-900 dark:text-white">{title}</h2>
          <p className="text-section-desc mx-auto mt-3">{description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="h-12 cursor-pointer rounded-full px-8 text-base font-bold shadow-lg shadow-primary/10"
              asChild
            >
              <a href={`mailto:${email}?subject=${encodeURIComponent(emailSubject)}`}>
                {primaryLabel}
                <ArrowRight className={cn("ml-2 h-4 w-4", ICON_ON_PRIMARY)} />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 cursor-pointer rounded-full border-slate-200 px-8 text-base dark:border-slate-700"
              asChild
            >
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
