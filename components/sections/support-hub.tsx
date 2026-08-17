"use client";

import { useState } from "react";
import Link from "next/link";
import { faqs } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ScrollReveal, ScrollRevealItem, ScrollStagger } from "@/components/motion/scroll-reveal";
import { cn } from "@/lib/utils";

const AUDIENCES = [
  {
    eyebrow: "For startups",
    title: "First product, shipped properly.",
    body: "End-to-end full-stack — Next.js, Laravel, mobile, and the cloud — so your first version is something you can actually run, not a demo that dies in staging.",
  },
  {
    eyebrow: "For agencies",
    title: "Senior overflow, not extra management.",
    body: "I embed as lead engineering on client work: architecture, delivery, and an AI-assisted workflow that keeps velocity honest without adding a layer of process.",
  },
  {
    eyebrow: "For product teams",
    title: "Architecture, AI, and a second brain.",
    body: "RAG pipelines, automation, code review, and mentoring — the same consultancy I already do for in-house teams who need a senior engineer without hiring one full-time.",
  },
] as const;

export function SupportHub() {
  return (
    <section
      id="support"
      className="relative overflow-x-hidden bg-canvas py-[var(--section-py)]"
    >
      <div className="ds-container">
        <ScrollReveal>
          <header className="mb-8 max-w-[40rem] md:mb-10">
            <Eyebrow>Support Hub</Eyebrow>
          </header>
          <Card
            variant="feature"
            className="relative overflow-hidden px-6 py-16 text-center sm:px-10 md:px-16 md:py-24"
          >
            <div className="relative z-10 mx-auto max-w-[40rem]">
              <h2 className="font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-d-text">
                Let&apos;s build your next{" "}
                <span className="text-lime">product.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-[46ch] text-[length:var(--fs-lead)] text-d-muted">
                Can&apos;t find what you&apos;re looking for? Contact me
                directly — I&apos;ll tell you plainly if I&apos;m the right
                engineer for it.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="primary"
                  asChild
                  className="focus-visible:ring-offset-ink"
                >
                  <Link href="/schedule">
                    Start a Project
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
                  <Link href="/portfolio">View Portfolio</Link>
                </Button>
              </div>
            </div>
          </Card>
        </ScrollReveal>

        <div className="mt-16 md:mt-20">
          <ScrollReveal>
            <Eyebrow>Three ways in</Eyebrow>
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
                    href="/schedule"
                    className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-pine"
                  >
                    Get in touch
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
              Common questions
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
  faq: (typeof faqs)[number];
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
