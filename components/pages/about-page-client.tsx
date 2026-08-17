"use client";

import { Icon } from "@iconify/react";
import { Check, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Approach } from "@/components/sections/approach";
import { FeaturedPortfolio } from "@/components/sections/featured-portfolio";
import { PageCta } from "@/components/sections/page-cta";
import { PageHero } from "@/components/sections/page-hero";
import { StatsStrip } from "@/components/sections/stats-strip";
import { TechStack } from "@/components/sections/tech-stack";
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollStagger,
} from "@/components/motion/scroll-reveal";
import { footerData } from "@/lib/data";
import { aboutBio, aboutHighlights } from "@/lib/data/about";

const CONTACT_EMAIL = aboutBio.email;

export function AboutPageClient() {
  return (
    <main className="min-h-screen bg-canvas pt-[120px] lg:pt-[140px]">
      <PageHero
        eyebrow="ABOUT"
        title="Hi, I'm Ali Raza"
        emphasis="Ali Raza"
        description={aboutBio.subtitle}
      />
      <AboutIntro />
      <StatsStrip />
      <ScrollReveal>
        <TechStack />
      </ScrollReveal>
      <FeaturedPortfolio limit={2} />
      <ScrollReveal>
        <Approach />
      </ScrollReveal>
      <PageCta />
    </main>
  );
}

function AboutIntro() {
  return (
    <section className="bg-canvas pb-12 md:pb-16">
      <div className="ds-container">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <ScrollReveal>
            <div className="relative mx-auto max-w-md lg:mx-0">
              <div className="overflow-hidden rounded-lg border border-hairline">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={aboutBio.image}
                  alt={aboutBio.name}
                  className="aspect-4/5 w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4">
                <Chip
                  tabIndex={-1}
                  className="pointer-events-none cursor-default border-pine text-pine hover:border-pine hover:text-pine"
                >
                  Top Rated Plus
                </Chip>
              </div>
            </div>
          </ScrollReveal>

          <div>
            <ScrollReveal>
              <h2 className="font-sora text-[length:var(--fs-h2)] font-extrabold tracking-[-0.02em] text-ink">
                {aboutBio.title}
              </h2>
              <div className="mt-4 space-y-4">
                {aboutBio.paragraphs.map((p) => (
                  <p
                    key={p.slice(0, 32)}
                    className="text-sm leading-relaxed text-muted sm:text-base"
                  >
                    {p}
                  </p>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-pine" />
                  {aboutBio.location}
                </span>
                <a
                  href={`mailto:${aboutBio.email}`}
                  className="inline-flex items-center gap-1.5 text-muted transition-colors duration-[var(--dur-fast)] hover:text-pine"
                >
                  <Mail className="h-4 w-4 text-pine" />
                  {aboutBio.email}
                </a>
              </div>
            </ScrollReveal>

            <ScrollStagger className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {aboutHighlights.map((item) => (
                <ScrollRevealItem key={item}>
                  <Card variant="base" className="flex items-start gap-2.5 p-4 hover:translate-y-0">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-ink" aria-hidden />
                    <span className="text-xs text-ink-soft sm:text-sm">{item}</span>
                  </Card>
                </ScrollRevealItem>
              ))}
            </ScrollStagger>

            <ScrollReveal className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="primary" asChild>
                <a href={`mailto:${CONTACT_EMAIL}?subject=Project inquiry`}>
                  Hire Me
                  <span
                    aria-hidden
                    className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
                  >
                    →
                  </span>
                </a>
              </Button>
              <div className="flex gap-2">
                {footerData.socials.slice(0, 4).map((social) => (
                  <Button
                    key={social.name}
                    variant="ghost"
                    asChild
                    aria-label={social.name}
                    className="h-10 w-10 rounded-md p-0"
                  >
                    <a href={social.href}>
                      <Icon icon={social.icon} className="h-4 w-4" />
                    </a>
                  </Button>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
