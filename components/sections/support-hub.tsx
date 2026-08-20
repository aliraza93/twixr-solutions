"use client";

import { useState } from "react";
import Link from "next/link";
import { faqs as fallbackFaqs } from "@/content/faq";
import { support } from "@/content/support";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ScrollReveal, ScrollRevealItem, ScrollStagger } from "@/components/motion/scroll-reveal";
import { cn } from "@/lib/utils";
import type { FaqItem } from "@/lib/cms/types";

const AUDIENCES = support.audiences;

export function SupportHub({ faqs: faqItems }: { faqs?: FaqItem[] }) {
  const faqs = faqItems?.length ? faqItems : fallbackFaqs;
  return (
    <section
      id="services"
      className="relative overflow-x-hidden bg-canvas py-[var(--section-py)]"
    >
      <div className="ds-container">
        <ScrollReveal>
          <header className="mb-8 max-w-[40rem] md:mb-10">
            <Eyebrow>{support.eyebrow}</Eyebrow>
          </header>
          <Card
            variant="feature"
            className="relative overflow-hidden px-6 py-16 text-center sm:px-10 md:px-16 md:py-24"
          >
            <div className="relative z-10 mx-auto max-w-[40rem]">
              <h2 className="font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-d-text">
                {support.headingBefore}{" "}
                <span className="text-lime">{support.headingEmphasis}</span>
              </h2>
              <p className="mx-auto mt-5 max-w-[46ch] text-[length:var(--fs-lead)] text-d-muted">
                {support.lead}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="primary"
                  asChild
                  className="focus-visible:ring-offset-ink"
                >
                  <Link href={support.primaryCta.href}>
                    {support.primaryCta.label}
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
                  <Link href={support.secondaryCta.href}>{support.secondaryCta.label}</Link>
                </Button>
              </div>
            </div>
          </Card>
        </ScrollReveal>

        <div className="mt-16 md:mt-20">
          <ScrollReveal>
            <Eyebrow>{support.waysEyebrow}</Eyebrow>
          </ScrollReveal>

          <ScrollStagger className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((item) => (
              <ScrollRevealItem key={item.eyebrow} className="h-full">
                <Card variant="base" className="flex h-full flex-col">
                  <p className="font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em] text-pine">
                    {item.eyebrow}
                  </p>
                  <h3 className="mt-4 font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em] text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                    {item.body}
                  </p>
                  <Link
                    href={support.contactHref}
                    className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-pine"
                  >
                    {support.contactLabel}
                    <span
                      aria-hidden
                      className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                    >
                      →
                    </span>
                  </Link>
                </Card>
              </ScrollRevealItem>
            ))}
          </ScrollStagger>
        </div>

        <div className="mx-auto mt-16 max-w-3xl md:mt-20">
          <ScrollReveal>
            <h3 className="font-sora text-[length:var(--fs-h2)] font-bold tracking-[-0.02em] text-ink">
              {support.faqHeading}
            </h3>
          </ScrollReveal>
          <div className="mt-8">
            {faqs.map((faq, index) => (
              <FaqRow key={faq.question} faq={faq} defaultOpen={index === 0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqRow({
  faq,
  defaultOpen,
}: {
  faq: FaqItem;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("border-t border-hairline", "last:border-b")}>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent py-5 text-left font-[inherit] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-sora text-base font-semibold tracking-[-0.02em] text-ink">
          {faq.question}
        </span>
        <span
          aria-hidden
          className={cn(
            "shrink-0 font-mono text-lg leading-none text-muted transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]",
            open && "rotate-45"
          )}
        >
          +
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-[var(--dur)] ease-[var(--ease-out)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="pb-5 text-sm leading-relaxed text-muted">{faq.answer}</p>
        </div>
      </div>
    </div>
  );
}
