"use client";

import {
  Code2,
  Compass,
  Rocket,
  Search,
  TrendingUp,
} from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { OrbitDiagram, type OrbitNode } from "@/components/ui/orbit-diagram";

const NODES: OrbitNode[] = [
  {
    id: "discover",
    label: "Discover",
    icon: <Search />,
    panel: {
      index: "01",
      logo: "Discovery",
      tagline: "Clarity before a single line",
      desc: "Goals, users, and constraints get mapped into a roadmap the team can actually ship against.",
      tags: ["Workshops", "Audits", "Roadmaps", "KPI mapping"],
      stats: [
        { value: "2 wks", unit: "Typical" },
        { value: "100%", unit: "Alignment" },
      ],
      href: "#process",
    },
  },
  {
    id: "design",
    label: "Design",
    icon: <Compass />,
    panel: {
      index: "02",
      logo: "Architecture",
      tagline: "Systems built to last",
      desc: "Schemas, APIs, and UX flows designed for the product you will still be running in three years.",
      tags: ["Domain model", "API design", "Figma", "UX flows"],
      stats: [
        { value: "12+", unit: "Systems" },
        { value: "0", unit: "Rewrites" },
      ],
      href: "#process",
    },
  },
  {
    id: "build",
    label: "Build",
    icon: <Code2 />,
    panel: {
      index: "03",
      logo: "Engineering",
      tagline: "Ship the hard parts",
      desc: "Laravel, Next.js, and AI automation in tight sprints — production-grade from the first merge.",
      tags: ["Laravel", "Next.js", "PostgreSQL", "CI/CD"],
      stats: [
        { value: "99.9%", unit: "Uptime" },
        { value: "<200ms", unit: "TTFB" },
      ],
      href: "#process",
    },
  },
  {
    id: "ship",
    label: "Ship",
    icon: <Rocket />,
    panel: {
      index: "04",
      logo: "Launch",
      tagline: "Zero-drama deploys",
      desc: "Pipelines, observability, and a launch checklist that holds up when real traffic arrives.",
      tags: ["Docker", "AWS", "GitHub Actions", "Sentry"],
      stats: [
        { value: "<15m", unit: "Deploy" },
        { value: "24/7", unit: "Monitoring" },
      ],
      href: "#process",
    },
  },
  {
    id: "scale",
    label: "Scale",
    icon: <TrendingUp />,
    panel: {
      index: "05",
      logo: "Growth",
      tagline: "From launch to load",
      desc: "Caching, queues, and infrastructure with headroom for the hockey stick — not a rewrite.",
      tags: ["Redis", "CDN", "Queues", "Autoscaling"],
      stats: [
        { value: "10×", unit: "Headroom" },
        { value: "99.99%", unit: "SLA" },
      ],
      href: "#process",
    },
  },
];

export function Workflow() {
  return (
    <section
      id="workflow"
      className="band-dark relative overflow-hidden scroll-mt-24 py-[var(--section-py)]"
    >
      <div className="ds-container relative z-10">
        <header className="max-w-[36rem]">
          <Eyebrow>How I build</Eyebrow>
          <h2 className="mt-5 font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
            <span className="block">One connected cycle.</span>
            <span className="mt-1 block text-pine">From idea to scale.</span>
          </h2>
          <p className="mt-5 max-w-[52ch] text-[length:var(--fs-lead)] text-muted">
            Five phases, one loop — from the first workshop to traffic that holds.
            Touch a node to explore.
          </p>
        </header>

        <OrbitDiagram
          className="mt-14 md:mt-16"
          hub={{ label: "Twixr", sub: "Delivery" }}
          nodes={NODES}
          autoRotate
          rotateMs={16000}
        />
      </div>
    </section>
  );
}
