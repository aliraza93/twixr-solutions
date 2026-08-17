"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { site } from "@/content/site";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { cn } from "@/lib/utils";

type PageCtaProps = {
  title?: ReactNode;
  emphasis?: string;
  description?: string;
  email?: string;
  emailSubject?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
};

function Title({
  title,
  emphasis,
}: {
  title: ReactNode;
  emphasis?: string;
}) {
  if (typeof title === "string" && emphasis) {
    const index = title.indexOf(emphasis);
    if (index !== -1) {
      return (
        <>
          {title.slice(0, index)}
          <span className="text-lime">{emphasis}</span>
          {title.slice(index + emphasis.length)}
        </>
      );
    }
    return (
      <>
        {title} <span className="text-lime">{emphasis}</span>
      </>
    );
  }

  return title;
}

export function PageCta({
  title = "Ready to start your project?",
  emphasis = "project",
  description = "Let's discuss your requirements and build something great together.",
  primaryLabel = site.primaryCta.label,
  primaryHref = site.primaryCta.href,
  secondaryLabel = "View Portfolio",
  secondaryHref = "/portfolio",
  className,
}: PageCtaProps) {
  return (
    <section className={cn("bg-canvas py-[var(--section-py)]", className)}>
      <div className="ds-container">
        <ScrollReveal>
          <Card
            variant="feature"
            className="relative overflow-hidden px-6 py-16 text-center sm:px-10 md:px-16 md:py-24"
          >
            <div className="relative z-10 mx-auto max-w-[40rem]">
              <h2 className="font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-d-text">
                <Title title={title} emphasis={emphasis} />
              </h2>
              <p className="mx-auto mt-5 max-w-[46ch] text-[length:var(--fs-lead)] text-d-muted">
                {description}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="primary"
                  asChild
                  className="focus-visible:ring-offset-ink"
                >
                  <Link href={primaryHref}>
                    {primaryLabel}
                    <span
                      aria-hidden
                      className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                    >
                      →
                    </span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  asChild
                  className="border-d-hairline text-d-text hover:border-d-text hover:bg-white/10 focus-visible:ring-offset-ink"
                >
                  <Link href={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              </div>
            </div>
          </Card>
        </ScrollReveal>
      </div>
    </section>
  );
}
