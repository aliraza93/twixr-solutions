"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/section-heading";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  emphasis?: string;
  emphasisStyle?: "color" | "gradient" | "outline";
  description?: string;
  align?: "left" | "center";
  visual?: ReactNode;
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  emphasis,
  emphasisStyle = "color",
  description,
  align = "center",
  visual,
  className,
}: PageHeroProps) {
  const heading = (
    <SectionHeading
      as="h1"
      align={visual ? "left" : align}
      eyebrow={eyebrow}
      title={title}
      emphasis={emphasis}
      emphasisStyle={emphasisStyle}
      description={description}
    />
  );

  return (
    <section className={cn("bg-canvas pb-12 pt-6 lg:pb-16", className)}>
      <div className="ds-container">
        {visual ? (
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal>{heading}</ScrollReveal>
            <ScrollReveal delay={0.08}>{visual}</ScrollReveal>
          </div>
        ) : (
          <ScrollReveal>{heading}</ScrollReveal>
        )}
      </div>
    </section>
  );
}
