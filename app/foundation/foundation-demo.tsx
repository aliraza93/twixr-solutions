"use client";

import { Bot, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconNode } from "@/components/ui/icon-node";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatBlock } from "@/components/ui/stat-block";
import { ScrollReveal, ScrollRevealItem, ScrollStagger } from "@/components/motion/scroll-reveal";

function PrimitiveGallery() {
  return (
    <div className="flex flex-col gap-16">
      <SectionHeading
        eyebrow="Our methodology"
        title="One mission. Two ways we build."
        emphasis="build"
        description="Primitives below consume semantic tokens only — wrap the tree in .band-dark and the palette inverts with no per-component overrides."
      />

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary">Start a Project</Button>
        <Button variant="ghost">View Portfolio</Button>
        <Button variant="text">Learn more</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Chip>AI fluent people</Chip>
        <Chip active>Trained AI agents</Chip>
        <Chip>Working side by side</Chip>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card variant="base" title="Base card">
          <p className="mt-3 text-muted">
            White canvas, hairline border, lift + shadow on hover.
          </p>
        </Card>
        <Card variant="feature" title="Feature card">
          <p className="mt-3 text-d-muted">
            Dark island for one highlighted card per row.
          </p>
        </Card>
        <Card variant="numbered" index={1} title="Numbered card">
          <p className="mt-3 text-muted">
            Mono index, Sora title, muted body — the Why pattern.
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-10 md:gap-16">
        <IconNode label="AI fluent operators" sublabel="Human">
          <User />
        </IconNode>
        <IconNode label="Trained AI agents" sublabel="AI" accent="lime" size="lg">
          <Bot />
        </IconNode>
        <IconNode label="Your team AI native" sublabel="Embedded">
          <Sparkles />
        </IconNode>
      </div>

      <div className="grid grid-cols-2 gap-8 border-y border-hairline py-10 md:grid-cols-4">
        <StatBlock value="10+" label="Years" />
        <StatBlock value="200+" label="Shipped" />
        <StatBlock value="15+" label="Industries" />
        <StatBlock value="99.9%" label="Uptime" />
      </div>
    </div>
  );
}

export function FoundationDemo() {
  return (
    <div className="bg-canvas text-ink">
      <section className="relative overflow-hidden border-b border-hairline py-[var(--section-py)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "var(--glow-accent-light), var(--glow-lime-light)" }}
          aria-hidden
        />
        <div className="ds-container relative">
          <Eyebrow>Design foundation</Eyebrow>
          <h1 className="mt-5 max-w-[18ch] font-sora text-[length:var(--fs-display)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink">
            Tokens, type, and primitives —{" "}
            <span className="bg-[image:var(--grad-emphasis)] bg-clip-text text-transparent">
              before sections
            </span>
          </h1>
          <p className="mt-6 max-w-[60ch] text-[length:var(--fs-lead)] text-muted">
            Sora on headings, Inter on body, JetBrains Mono on eyebrows. Same
            components render in both the light canvas and a dark band.
          </p>

          <dl className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-hairline bg-canvas p-6 shadow-sm">
              <dt className="font-mono text-[length:var(--fs-eyebrow)] uppercase tracking-[0.18em] text-pine">
                Display
              </dt>
              <dd className="mt-3 font-sora text-2xl font-bold tracking-[-0.02em] text-ink">
                Sora 800
              </dd>
            </div>
            <div className="rounded-lg border border-hairline bg-canvas p-6 shadow-sm">
              <dt className="font-mono text-[length:var(--fs-eyebrow)] uppercase tracking-[0.18em] text-pine">
                Body
              </dt>
              <dd className="mt-3 font-inter text-2xl font-medium text-ink">
                Inter 400–600
              </dd>
            </div>
            <div className="rounded-lg border border-hairline bg-canvas p-6 shadow-sm">
              <dt className="font-mono text-[length:var(--fs-eyebrow)] uppercase tracking-[0.18em] text-pine">
                Labels
              </dt>
              <dd className="mt-3 font-mono text-lg font-medium tracking-[0.08em] text-ink">
                JetBrains Mono
              </dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            {[
              ["canvas", "bg-canvas border border-hairline"],
              ["surface", "bg-surface"],
              ["ink", "bg-ink"],
              ["pine", "bg-pine"],
              ["lime", "bg-lime"],
              ["hairline", "bg-hairline"],
            ].map(([name, swatch]) => (
              <div key={name} className="flex items-center gap-2">
                <span className={`h-8 w-8 rounded-sm shadow-sm ${swatch}`} />
                <span className="font-mono text-[12px] text-muted">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-hairline bg-canvas py-[var(--section-py)]">
        <div className="ds-container">
          <Eyebrow>Light canvas</Eyebrow>
          <p className="mb-12 mt-3 font-sora text-[length:var(--fs-h2)] font-bold tracking-[-0.02em]">
            Default token context
          </p>
          <PrimitiveGallery />
        </div>
      </section>

      <section className="band-dark py-[var(--section-py)]">
        <div className="ds-container">
          <Eyebrow>Dark band</Eyebrow>
          <p className="mb-12 mt-3 font-sora text-[length:var(--fs-h2)] font-bold tracking-[-0.02em] text-ink">
            Same tree, remapped tokens
          </p>
          <PrimitiveGallery />
        </div>
      </section>

      <section className="bg-surface py-[var(--section-py)]">
        <div className="ds-container">
          <SectionHeading
            eyebrow="Motion"
            title="Scroll reveal with stagger."
            emphasis="stagger"
            description="Opacity 0→1 and translateY(24px→0) over 0.8s with cubic-bezier(.22,1,.36,1). prefers-reduced-motion disables the transform and leaves content visible."
          />
          <ScrollStagger className="mt-12 grid gap-6 md:grid-cols-3" stagger={0.07}>
            {["Discover", "Design", "Build"].map((label, i) => (
              <ScrollRevealItem key={label}>
                <Card variant="numbered" index={i + 1} title={label}>
                  <p className="mt-3 text-muted">
                    IntersectionObserver-driven. No animation when reduced motion is on.
                  </p>
                </Card>
              </ScrollRevealItem>
            ))}
          </ScrollStagger>
          <ScrollReveal className="mt-8" delay={0.12}>
            <p className="font-mono text-[length:var(--fs-eyebrow)] uppercase tracking-[0.18em] text-muted">
              Lenis smooth scroll is active on this page
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
