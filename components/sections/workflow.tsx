"use client";

import {
  Code2,
  Compass,
  Rocket,
  Search,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { process } from "@/content/process";
import { Eyebrow } from "@/components/ui/eyebrow";
import { OrbitDiagram, type OrbitNode } from "@/components/ui/orbit-diagram";

const ICONS: Record<(typeof process.phases)[number]["icon"], LucideIcon> = {
  search: Search,
  compass: Compass,
  code: Code2,
  rocket: Rocket,
  trending: TrendingUp,
};

const NODES: OrbitNode[] = process.phases.map((phase) => {
  const Icon = ICONS[phase.icon];
  return {
    id: phase.id,
    label: phase.title,
    icon: <Icon />,
    panel: {
      index: phase.panel.index,
      logo: phase.panel.logo,
      tagline: phase.panel.tagline,
      desc: phase.panel.desc,
      tags: [...phase.panel.tools],
      stats: phase.panel.stats.map((s) => ({ ...s })),
      href: phase.panel.href,
    },
  };
});

export function Workflow() {
  return (
    <section
      id="workflow"
      className="band-dark relative overflow-hidden scroll-mt-24 py-[var(--section-py)]"
    >
      <div className="ds-container relative z-10">
        <header className="max-w-[36rem]">
          <Eyebrow>{process.eyebrow}</Eyebrow>
          <h2 className="mt-5 font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
            <span className="block">{process.headingLine1}</span>
            <span className="mt-1 block text-pine">{process.headingLine2}</span>
          </h2>
          <p className="mt-5 max-w-[52ch] text-[length:var(--fs-lead)] text-muted">
            {process.lead}
          </p>
        </header>

        <OrbitDiagram
          className="mt-14 md:mt-16"
          hub={{ label: process.hub.label, sub: process.hub.sub }}
          nodes={NODES}
          autoRotate
          rotateMs={16000}
        />
      </div>
    </section>
  );
}
